export const DESKTOP_HARDWARE_PROFILE_VERSION = 1 as const;
export const DESKTOP_STORAGE_KINDS = ["ssd", "hdd", "unknown"] as const;

export type DesktopStorageKind = (typeof DESKTOP_STORAGE_KINDS)[number];
export type DesktopHardwarePlatform = "windows" | "macos";
export type DesktopHardwareArchitecture = "x64" | "arm64";

export type DesktopHardwareProfile = Readonly<{
  profileVersion: typeof DESKTOP_HARDWARE_PROFILE_VERSION;
  profileId: string;
  platform: DesktopHardwarePlatform;
  osFamily: string;
  osBuild: string | null;
  architecture: DesktopHardwareArchitecture;
  cpuModel: string;
  installedMemoryBytes: number;
  gpuModel: string;
  storageKind: DesktopStorageKind;
  touchInput: boolean;
}>;

export type DesktopHardwareProfileAssessment = Readonly<{
  accepted: boolean;
  readyForThresholdCalibration: boolean;
  profile: DesktopHardwareProfile | null;
  missing: readonly string[];
  blockers: readonly string[];
}>;

export const WINDOWS_LOW_SPEC_REFERENCE_PROFILE = Object.freeze({
  profileVersion: DESKTOP_HARDWARE_PROFILE_VERSION,
  profileId: "windows-low-spec-reference-v1",
  platform: "windows",
  osFamily: "windows-11",
  osBuild: "26200.9168",
  architecture: "x64",
  cpuModel: "Intel Core i5-8365U",
  installedMemoryBytes: 8 * 1024 * 1024 * 1024,
  gpuModel: "Intel UHD Graphics 620",
  storageKind: "ssd",
  touchInput: false,
} as const satisfies DesktopHardwareProfile);

const PROFILE_KEYS = [
  "profileVersion",
  "profileId",
  "platform",
  "osFamily",
  "osBuild",
  "architecture",
  "cpuModel",
  "installedMemoryBytes",
  "gpuModel",
  "storageKind",
  "touchInput",
] as const;
const SAFE_PROFILE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const SAFE_OS_FAMILY = /^[a-z0-9][a-z0-9.-]{0,63}$/;
const SAFE_OS_BUILD = /^[a-z0-9][a-z0-9._+-]{0,63}$/i;
const SAFE_HARDWARE_TEXT = /^[a-z0-9][a-z0-9 .()+_/-]{0,127}$/i;
const MINIMUM_MEMORY_BYTES = 2 * 1024 * 1024 * 1024;
const MAXIMUM_MEMORY_BYTES = 256 * 1024 * 1024 * 1024;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactDataKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Reflect.ownKeys(record);
  if (keys.length !== expected.length) return false;

  return keys.every((key) => {
    if (typeof key !== "string" || !expected.includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor !== undefined && "value" in descriptor;
  });
}

function failure(): DesktopHardwareProfileAssessment {
  return Object.freeze({
    accepted: false,
    readyForThresholdCalibration: false,
    profile: null,
    missing: Object.freeze([]),
    blockers: Object.freeze(["invalid_hardware_profile"]),
  });
}

export function assessDesktopHardwareProfile(
  input: unknown,
): DesktopHardwareProfileAssessment {
  if (!isPlainRecord(input) || !hasExactDataKeys(input, PROFILE_KEYS))
    return failure();

  if (
    input.profileVersion !== DESKTOP_HARDWARE_PROFILE_VERSION ||
    typeof input.profileId !== "string" ||
    !SAFE_PROFILE_ID.test(input.profileId) ||
    (input.platform !== "windows" && input.platform !== "macos") ||
    typeof input.osFamily !== "string" ||
    !SAFE_OS_FAMILY.test(input.osFamily) ||
    (input.osBuild !== null &&
      (typeof input.osBuild !== "string" ||
        !SAFE_OS_BUILD.test(input.osBuild))) ||
    (input.architecture !== "x64" && input.architecture !== "arm64") ||
    typeof input.cpuModel !== "string" ||
    !SAFE_HARDWARE_TEXT.test(input.cpuModel) ||
    typeof input.installedMemoryBytes !== "number" ||
    !Number.isSafeInteger(input.installedMemoryBytes) ||
    input.installedMemoryBytes < MINIMUM_MEMORY_BYTES ||
    input.installedMemoryBytes > MAXIMUM_MEMORY_BYTES ||
    typeof input.gpuModel !== "string" ||
    !SAFE_HARDWARE_TEXT.test(input.gpuModel) ||
    !DESKTOP_STORAGE_KINDS.includes(input.storageKind as DesktopStorageKind) ||
    typeof input.touchInput !== "boolean"
  ) {
    return failure();
  }

  const profile = Object.freeze({
    profileVersion: DESKTOP_HARDWARE_PROFILE_VERSION,
    profileId: input.profileId,
    platform: input.platform,
    osFamily: input.osFamily,
    osBuild: input.osBuild,
    architecture: input.architecture,
    cpuModel: input.cpuModel,
    installedMemoryBytes: input.installedMemoryBytes,
    gpuModel: input.gpuModel,
    storageKind: input.storageKind as DesktopStorageKind,
    touchInput: input.touchInput,
  });
  const missing: string[] = [];
  if (profile.osBuild === null) missing.push("os_build");
  if (profile.storageKind === "unknown") missing.push("storage_kind");

  return Object.freeze({
    accepted: true,
    readyForThresholdCalibration: missing.length === 0,
    profile,
    missing: Object.freeze(missing),
    blockers: Object.freeze([]),
  });
}
