import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readdir, readlink } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { DESKTOP_ARTIFACT_DIGEST_ALGORITHM } from "../src/desktop/spike-evidence.js";

const MAXIMUM_ARTIFACT_BYTES = 10 * 1024 * 1024 * 1024;
const MAXIMUM_ARTIFACT_ENTRIES = 200_000;
const MAXIMUM_RELATIVE_PATH_LENGTH = 2_048;
const MAXIMUM_SYMLINK_TARGET_LENGTH = 1_024;

function artifactFailure(code) {
  throw new TypeError(code);
}

function compareNames(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isWithinRoot(root, target) {
  const location = relative(root, target);
  return (
    location === "" ||
    (!location.startsWith(`..${sep}`) &&
      location !== ".." &&
      !isAbsolute(location))
  );
}

function normalizedRelativePath(root, target) {
  const location = relative(root, target);
  if (
    location === "" ||
    !isWithinRoot(root, target) ||
    location.length > MAXIMUM_RELATIVE_PATH_LENGTH
  ) {
    return artifactFailure("invalid_artifact_path");
  }
  return location.split(sep).join("/");
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

function addEntry(state, value) {
  state.entryCount += 1;
  if (state.entryCount > MAXIMUM_ARTIFACT_ENTRIES) {
    artifactFailure("artifact_entry_limit");
  }
  state.digest.update(`${JSON.stringify(value)}\n`);
}

async function walkArtifact(root, directory, state) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => compareNames(left.name, right.name));

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    const relativePath = normalizedRelativePath(root, path);
    const before = await lstat(path);
    const mode = before.mode & 0o777;

    if (before.isDirectory() && !before.isSymbolicLink()) {
      addEntry(state, ["directory", relativePath, mode]);
      await walkArtifact(root, path, state);
      continue;
    }

    if (before.isFile() && !before.isSymbolicLink()) {
      state.packagedArtifactBytes += before.size;
      if (
        !Number.isSafeInteger(state.packagedArtifactBytes) ||
        state.packagedArtifactBytes > MAXIMUM_ARTIFACT_BYTES
      ) {
        artifactFailure("artifact_byte_limit");
      }

      const fileSha256 = await sha256File(path);
      const after = await lstat(path);
      if (
        !after.isFile() ||
        after.isSymbolicLink() ||
        after.size !== before.size ||
        after.mode !== before.mode ||
        after.mtimeMs !== before.mtimeMs
      ) {
        artifactFailure("artifact_changed_during_hash");
      }
      addEntry(state, ["file", relativePath, mode, before.size, fileSha256]);
      continue;
    }

    if (before.isSymbolicLink()) {
      const linkTarget = await readlink(path);
      if (
        linkTarget.length === 0 ||
        linkTarget.length > MAXIMUM_SYMLINK_TARGET_LENGTH ||
        isAbsolute(linkTarget) ||
        !isWithinRoot(root, resolve(dirname(path), linkTarget))
      ) {
        artifactFailure("unsafe_artifact_symlink");
      }
      addEntry(state, ["symlink", relativePath, linkTarget]);
      continue;
    }

    artifactFailure("unsupported_artifact_entry");
  }
}

export async function digestDesktopPackagedArtifact(input) {
  if (typeof input !== "string" || input.length === 0 || input.length > 4_096) {
    return artifactFailure("invalid_artifact_root");
  }

  const root = resolve(input);
  const metadata = await lstat(root);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    return artifactFailure("invalid_artifact_root");
  }

  const state = {
    digest: createHash("sha256"),
    entryCount: 0,
    packagedArtifactBytes: 0,
  };
  state.digest.update(`${DESKTOP_ARTIFACT_DIGEST_ALGORITHM}\n`);
  await walkArtifact(root, root, state);

  if (state.entryCount === 0 || state.packagedArtifactBytes === 0) {
    return artifactFailure("empty_artifact");
  }

  return Object.freeze({
    algorithm: DESKTOP_ARTIFACT_DIGEST_ALGORITHM,
    artifactSha256: state.digest.digest("hex"),
    packagedArtifactBytes: state.packagedArtifactBytes,
    entryCount: state.entryCount,
  });
}
