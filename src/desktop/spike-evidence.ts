export const DESKTOP_HOST_CANDIDATES = ["electron", "tauri"] as const;
export const DESKTOP_HOST_PLATFORMS = ["windows", "macos"] as const;
export const DESKTOP_ARCHITECTURES = ["x64", "arm64"] as const;
export const BOARD_FRAME_P95_LIMIT_MS = 16.7;

export type DesktopHostCandidate = (typeof DESKTOP_HOST_CANDIDATES)[number];
export type DesktopHostPlatform = (typeof DESKTOP_HOST_PLATFORMS)[number];
export type DesktopArchitecture = (typeof DESKTOP_ARCHITECTURES)[number];

export type DesktopHostObservation = Readonly<{
  candidate: DesktopHostCandidate;
  platform: DesktopHostPlatform;
  architecture: DesktopArchitecture;
  hostVersion: string;
  osVersion: string;
  commitSha: string;
  artifactSha256: string;
  measuredAt: string;
  packagedArtifactBytes: number;
  coldStartMs: number;
  warmStartMs: number;
  idlePrivateMemoryBytes: number;
  boardFrameP95Ms: number;
  recoveredAfterCrash: boolean;
  deepLinkValidated: boolean;
  filePickerValidated: boolean;
  accessibilityTreeInspected: boolean;
  updaterSignatureValidated: boolean;
}>;

export type DesktopHostEvidenceAssessment = Readonly<{
  readyForDecision: boolean;
  observations: readonly DesktopHostObservation[];
  missing: readonly string[];
  blockers: readonly string[];
}>;

const OBSERVATION_KEYS = [
  "candidate",
  "platform",
  "architecture",
  "hostVersion",
  "osVersion",
  "commitSha",
  "artifactSha256",
  "measuredAt",
  "packagedArtifactBytes",
  "coldStartMs",
  "warmStartMs",
  "idlePrivateMemoryBytes",
  "boardFrameP95Ms",
  "recoveredAfterCrash",
  "deepLinkValidated",
  "filePickerValidated",
  "accessibilityTreeInspected",
  "updaterSignatureValidated",
] as const;

const SAFE_VERSION = /^[a-z0-9][a-z0-9._+-]{0,63}$/i;
const SHA_1 = /^[a-f0-9]{40}$/i;
const SHA_256 = /^[a-f0-9]{64}$/i;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(record: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(record);
  return keys.length === expected.length
    && keys.every((key) => typeof key === "string" && expected.includes(key));
}

function isMember<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isBoundedMetric(value: unknown, maximum: number, integer = false): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && value > 0
    && value <= maximum
    && (!integer || Number.isSafeInteger(value));
}

function isIsoInstant(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function parseObservation(value: unknown): DesktopHostObservation | null {
  if (!isPlainRecord(value) || !hasExactKeys(value, OBSERVATION_KEYS)) return null;

  if (!isMember(value.candidate, DESKTOP_HOST_CANDIDATES)
    || !isMember(value.platform, DESKTOP_HOST_PLATFORMS)
    || !isMember(value.architecture, DESKTOP_ARCHITECTURES)
    || typeof value.hostVersion !== "string"
    || !SAFE_VERSION.test(value.hostVersion)
    || typeof value.osVersion !== "string"
    || !SAFE_VERSION.test(value.osVersion)
    || typeof value.commitSha !== "string"
    || !SHA_1.test(value.commitSha)
    || typeof value.artifactSha256 !== "string"
    || !SHA_256.test(value.artifactSha256)
    || !isIsoInstant(value.measuredAt)
    || !isBoundedMetric(value.packagedArtifactBytes, 10 * 1024 * 1024 * 1024, true)
    || !isBoundedMetric(value.coldStartMs, 10 * 60 * 1_000)
    || !isBoundedMetric(value.warmStartMs, 10 * 60 * 1_000)
    || !isBoundedMetric(value.idlePrivateMemoryBytes, 128 * 1024 * 1024 * 1024, true)
    || !isBoundedMetric(value.boardFrameP95Ms, 10_000)
    || typeof value.recoveredAfterCrash !== "boolean"
    || typeof value.deepLinkValidated !== "boolean"
    || typeof value.filePickerValidated !== "boolean"
    || typeof value.accessibilityTreeInspected !== "boolean"
    || typeof value.updaterSignatureValidated !== "boolean") {
    return null;
  }

  return Object.freeze({
    candidate: value.candidate,
    platform: value.platform,
    architecture: value.architecture,
    hostVersion: value.hostVersion,
    osVersion: value.osVersion,
    commitSha: value.commitSha,
    artifactSha256: value.artifactSha256,
    measuredAt: value.measuredAt,
    packagedArtifactBytes: value.packagedArtifactBytes,
    coldStartMs: value.coldStartMs,
    warmStartMs: value.warmStartMs,
    idlePrivateMemoryBytes: value.idlePrivateMemoryBytes,
    boardFrameP95Ms: value.boardFrameP95Ms,
    recoveredAfterCrash: value.recoveredAfterCrash,
    deepLinkValidated: value.deepLinkValidated,
    filePickerValidated: value.filePickerValidated,
    accessibilityTreeInspected: value.accessibilityTreeInspected,
    updaterSignatureValidated: value.updaterSignatureValidated,
  });
}

function matrixKey(candidate: DesktopHostCandidate, platform: DesktopHostPlatform): string {
  return `${candidate}:${platform}`;
}

const REQUIRED_MATRIX = DESKTOP_HOST_CANDIDATES.flatMap((candidate) =>
  DESKTOP_HOST_PLATFORMS.map((platform) => matrixKey(candidate, platform)),
);

export function assessDesktopHostEvidence(input: unknown): DesktopHostEvidenceAssessment {
  if (!Array.isArray(input) || input.length > 16) {
    return Object.freeze({
      readyForDecision: false,
      observations: Object.freeze([]),
      missing: Object.freeze([...REQUIRED_MATRIX]),
      blockers: Object.freeze(["invalid_evidence_set"]),
    });
  }

  const observations: DesktopHostObservation[] = [];
  const blockers: string[] = [];
  const seen = new Set<string>();

  input.forEach((value, index) => {
    const observation = parseObservation(value);
    if (!observation) {
      blockers.push(`invalid_observation:${index}`);
      return;
    }

    const key = matrixKey(observation.candidate, observation.platform);
    if (seen.has(key)) {
      blockers.push(`duplicate_observation:${key}`);
      return;
    }
    seen.add(key);
    observations.push(observation);

    if (observation.boardFrameP95Ms > BOARD_FRAME_P95_LIMIT_MS) {
      blockers.push(`frame_budget:${key}`);
    }

    const qualityGates = {
      recoveredAfterCrash: observation.recoveredAfterCrash,
      deepLinkValidated: observation.deepLinkValidated,
      filePickerValidated: observation.filePickerValidated,
      accessibilityTreeInspected: observation.accessibilityTreeInspected,
      updaterSignatureValidated: observation.updaterSignatureValidated,
    };

    for (const [gate, passed] of Object.entries(qualityGates)) {
      if (!passed) blockers.push(`quality_gate:${key}:${gate}`);
    }
  });

  const missing = REQUIRED_MATRIX.filter((key) => !seen.has(key));
  const ordered = observations.slice().sort((left, right) =>
    matrixKey(left.candidate, left.platform).localeCompare(matrixKey(right.candidate, right.platform)),
  );

  return Object.freeze({
    readyForDecision: missing.length === 0 && blockers.length === 0,
    observations: Object.freeze(ordered),
    missing: Object.freeze(missing),
    blockers: Object.freeze(blockers),
  });
}
