import { execFile } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import { digestDesktopPackagedArtifact } from "./desktop-artifact-digest.mjs";
import {
  captureBoundDesktopHostObservation,
  serializeDesktopHostObservation,
} from "../src/desktop/spike-evidence.js";

const execFileAsync = promisify(execFile);
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OBSERVATION_ROOT = resolve(
  REPOSITORY_ROOT,
  ".desktop-build",
  "observations",
);
const ARTIFACT_ROOT = resolve(REPOSITORY_ROOT, "dist", "electron-spike");
const MAXIMUM_DRAFT_BYTES = 64 * 1024;

class CaptureFailure extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function fail(code: string): never {
  throw new CaptureFailure(code);
}

function isWithinRoot(root: string, target: string): boolean {
  const location = relative(root, target);
  return (
    location === "" ||
    (!location.startsWith(`..${sep}`) &&
      location !== ".." &&
      !isAbsolute(location))
  );
}

type CapturePathErrorCode = "unsafe_draft_path" | "unsafe_artifact_path";

export async function ensureTrustedDirectoryChain(
  root: string,
  target: string,
  createMissing: boolean,
  errorCode: CapturePathErrorCode,
): Promise<void> {
  if (!isWithinRoot(root, target)) return fail(errorCode);
  const location = relative(root, target);
  if (location === "") return;

  let current = root;
  for (const part of location.split(sep)) {
    current = resolve(current, part);
    const metadata = await lstat(current).catch(async () => {
      if (!createMissing) return fail(errorCode);
      try {
        await mkdir(current, { mode: 0o700 });
        return await lstat(current);
      } catch {
        return fail(errorCode);
      }
    });
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      return fail(errorCode);
    }
  }
}

async function resolveRegularDraft(input: string): Promise<string> {
  const path = resolve(REPOSITORY_ROOT, input);
  if (!isWithinRoot(OBSERVATION_ROOT, path) || path === OBSERVATION_ROOT) {
    return fail("unsafe_draft_path");
  }

  await ensureTrustedDirectoryChain(
    OBSERVATION_ROOT,
    dirname(path),
    false,
    "unsafe_draft_path",
  );
  const metadata = await lstat(path).catch(() => fail("invalid_draft_file"));
  if (metadata.isSymbolicLink()) return fail("unsafe_draft_path");
  if (
    !metadata.isFile() ||
    metadata.size === 0 ||
    metadata.size > MAXIMUM_DRAFT_BYTES
  ) {
    return fail("invalid_draft_file");
  }

  const canonicalRoot = await realpath(OBSERVATION_ROOT).catch(() =>
    fail("unsafe_draft_path"),
  );
  const canonicalPath = await realpath(path).catch(() =>
    fail("unsafe_draft_path"),
  );
  if (!isWithinRoot(canonicalRoot, canonicalPath)) {
    return fail("unsafe_draft_path");
  }
  return canonicalPath;
}

async function resolveArtifactRoot(input: string): Promise<string> {
  await ensureTrustedDirectoryChain(
    REPOSITORY_ROOT,
    ARTIFACT_ROOT,
    false,
    "unsafe_artifact_path",
  );
  const path = resolve(REPOSITORY_ROOT, input);
  if (!isWithinRoot(ARTIFACT_ROOT, path) || path === ARTIFACT_ROOT) {
    return fail("unsafe_artifact_path");
  }
  await ensureTrustedDirectoryChain(
    ARTIFACT_ROOT,
    path,
    false,
    "unsafe_artifact_path",
  );
  const canonicalRoot = await realpath(ARTIFACT_ROOT).catch(() =>
    fail("unsafe_artifact_path"),
  );
  const canonicalPath = await realpath(path).catch(() =>
    fail("unsafe_artifact_path"),
  );
  if (!isWithinRoot(canonicalRoot, canonicalPath)) {
    return fail("unsafe_artifact_path");
  }
  return canonicalPath;
}

async function cleanCommitSha(): Promise<string> {
  const status = await execFileAsync(
    "git",
    ["status", "--porcelain", "--untracked-files=normal"],
    { cwd: REPOSITORY_ROOT, windowsHide: true, timeout: 10_000 },
  );
  if (status.stdout.trim() !== "") return fail("dirty_worktree");

  const revision = await execFileAsync(
    "git",
    ["rev-parse", "--verify", "HEAD"],
    { cwd: REPOSITORY_ROOT, windowsHide: true, timeout: 10_000 },
  );
  const commitSha = revision.stdout.trim();
  if (!/^[a-f0-9]{40}$/i.test(commitSha)) return fail("invalid_commit");
  return commitSha;
}

function actualPlatform(): "windows" | "macos" | null {
  if (process.platform === "win32") return "windows";
  if (process.platform === "darwin") return "macos";
  return null;
}

function safeOutputName(observation: {
  readonly candidate: string;
  readonly platform: string;
  readonly hardwareProfileId: string;
  readonly measuredAt: string;
}): string {
  const instant = observation.measuredAt.replaceAll(/[-:.]/g, "");
  return `${observation.candidate}-${observation.platform}-${observation.hardwareProfileId}-${instant}.json`;
}

async function capture(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length !== 2) return fail("invalid_arguments");
  const [draftInput, artifactInput] = arguments_;
  if (draftInput === undefined || artifactInput === undefined) {
    return fail("invalid_arguments");
  }

  await ensureTrustedDirectoryChain(
    REPOSITORY_ROOT,
    OBSERVATION_ROOT,
    true,
    "unsafe_draft_path",
  );
  if (process.platform !== "win32") await chmod(OBSERVATION_ROOT, 0o700);
  const draftPath = await resolveRegularDraft(draftInput);
  const artifactPath = await resolveArtifactRoot(artifactInput);

  let draft: unknown;
  try {
    draft = JSON.parse(await readFile(draftPath, "utf8"));
  } catch {
    return fail("invalid_draft_json");
  }

  if (
    typeof draft !== "object" ||
    draft === null ||
    Array.isArray(draft) ||
    actualPlatform() === null ||
    Reflect.get(draft, "platform") !== actualPlatform() ||
    Reflect.get(draft, "architecture") !== process.arch
  ) {
    return fail("host_mismatch");
  }

  const [commitSha, artifact] = await Promise.all([
    cleanCommitSha(),
    digestDesktopPackagedArtifact(artifactPath),
  ]);
  const verifiedArtifact = await digestDesktopPackagedArtifact(artifactPath);
  if (
    artifact.algorithm !== verifiedArtifact.algorithm ||
    artifact.artifactSha256 !== verifiedArtifact.artifactSha256 ||
    artifact.packagedArtifactBytes !== verifiedArtifact.packagedArtifactBytes ||
    artifact.entryCount !== verifiedArtifact.entryCount
  ) {
    return fail("artifact_changed_during_capture");
  }
  const result = captureBoundDesktopHostObservation(draft, {
    commitSha,
    artifactDigestAlgorithm: artifact.algorithm,
    artifactSha256: artifact.artifactSha256,
    packagedArtifactBytes: artifact.packagedArtifactBytes,
  });
  if (!result.accepted || !result.observation) {
    return fail("invalid_observation");
  }

  const serialized = serializeDesktopHostObservation(result.observation);
  if (!serialized) return fail("invalid_observation");
  const outputName = safeOutputName(result.observation);
  const outputPath = resolve(OBSERVATION_ROOT, outputName);
  await writeFile(outputPath, serialized, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });

  console.log(
    JSON.stringify({
      accepted: true,
      candidate: result.observation.candidate,
      platform: result.observation.platform,
      hardwareProfileId: result.observation.hardwareProfileId,
      measuredAt: result.observation.measuredAt,
      artifactDigestAlgorithm: artifact.algorithm,
      artifactEntryCount: artifact.entryCount,
      output: `.desktop-build/observations/${outputName}`,
    }),
  );
}

const entryPoint = process.argv[1];
if (
  typeof entryPoint === "string" &&
  pathToFileURL(resolve(entryPoint)).href === import.meta.url
) {
  try {
    await capture();
  } catch (error) {
    const code =
      error instanceof CaptureFailure ? error.code : "capture_failed";
    console.error(JSON.stringify({ accepted: false, error: code }));
    process.exitCode = 1;
  }
}
