import assert from "node:assert/strict";
import { lstat, mkdir, mkdtemp, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ensureTrustedDirectoryChain } from "../scripts/capture-desktop-host-observation.js";
import {
  DESKTOP_ARTIFACT_DIGEST_ALGORITHM,
  DESKTOP_HOST_OBSERVATION_VERSION,
  captureBoundDesktopHostObservation,
  captureDesktopHostObservation,
  serializeDesktopHostObservation,
} from "../src/desktop/spike-evidence.js";

function draft() {
  return {
    observationVersion: DESKTOP_HOST_OBSERVATION_VERSION,
    candidate: "electron",
    platform: "windows",
    architecture: "x64",
    hardwareProfileId: "windows-low-spec-reference-v1",
    hostVersion: "44.2.0",
    osVersion: "windows-11-25h2",
    measuredAt: "2026-09-07T12:30:00.000Z",
    coldStartMs: 1_400,
    warmStartMs: 700,
    idlePrivateMemoryBytes: 260_000_000,
    boardFrameP95Ms: 14,
    recoveredAfterCrash: false,
    deepLinkValidated: true,
    filePickerValidated: true,
    accessibilityTreeInspected: false,
    updaterSignatureValidated: false,
  } as const;
}

function binding() {
  return {
    commitSha: "a".repeat(40),
    artifactDigestAlgorithm: DESKTOP_ARTIFACT_DIGEST_ALGORITHM,
    artifactSha256: "b".repeat(64),
    packagedArtifactBytes: 120_000_000,
  } as const;
}

test("capture binds a safe draft to the exact commit and packaged tree digest", () => {
  const result = captureBoundDesktopHostObservation(draft(), binding());
  assert.equal(result.accepted, true);
  assert.deepEqual(result.blockers, []);
  assert.deepEqual(result.observation, {
    observationVersion: 1,
    candidate: "electron",
    platform: "windows",
    architecture: "x64",
    hardwareProfileId: "windows-low-spec-reference-v1",
    hostVersion: "44.2.0",
    osVersion: "windows-11-25h2",
    commitSha: "a".repeat(40),
    artifactDigestAlgorithm: DESKTOP_ARTIFACT_DIGEST_ALGORITHM,
    artifactSha256: "b".repeat(64),
    measuredAt: "2026-09-07T12:30:00.000Z",
    packagedArtifactBytes: 120_000_000,
    coldStartMs: 1_400,
    warmStartMs: 700,
    idlePrivateMemoryBytes: 260_000_000,
    boardFrameP95Ms: 14,
    recoveredAfterCrash: false,
    deepLinkValidated: true,
    filePickerValidated: true,
    accessibilityTreeInspected: false,
    updaterSignatureValidated: false,
  });
  assert.equal(Object.isFrozen(result.observation), true);
});

test("drafts cannot override computed bindings or add identifying fields", () => {
  for (const invalid of [
    { ...draft(), commitSha: "secret-local-commit" },
    { ...draft(), artifactSha256: "secret-local-artifact" },
    { ...draft(), deviceId: "secret-machine-id" },
  ]) {
    const result = captureBoundDesktopHostObservation(invalid, binding());
    assert.equal(result.accepted, false);
    assert.equal(result.observation, null);
    assert.deepEqual(result.blockers, ["invalid_observation"]);
    assert.equal(JSON.stringify(result).includes("secret"), false);
  }
});

test("bindings reject extra fields and unsafe digest metadata without echoing input", () => {
  for (const invalid of [
    { ...binding(), absolutePath: "/private/package" },
    { ...binding(), artifactDigestAlgorithm: "secret-algorithm" },
    { ...binding(), artifactSha256: "secret-hash" },
  ]) {
    const result = captureBoundDesktopHostObservation(draft(), invalid);
    assert.equal(result.accepted, false);
    assert.equal(JSON.stringify(result).includes("secret"), false);
    assert.equal(JSON.stringify(result).includes("/private"), false);
  }
});

test("accessor-backed drafts are rejected without invoking the accessor", () => {
  let accessed = false;
  const input: Record<string, unknown> = { ...draft() };
  Object.defineProperty(input, "hostVersion", {
    enumerable: true,
    configurable: true,
    get() {
      accessed = true;
      return "44.2.0";
    },
  });

  const result = captureBoundDesktopHostObservation(input, binding());
  assert.equal(result.accepted, false);
  assert.equal(accessed, false);
});

test("accepted records serialize canonically and invalid records do not serialize", () => {
  const capture = captureBoundDesktopHostObservation(draft(), binding());
  const serialized = serializeDesktopHostObservation(capture.observation);
  assert.ok(serialized?.endsWith("\n"));
  assert.deepEqual(
    captureDesktopHostObservation(JSON.parse(serialized!)).observation,
    capture.observation,
  );
  assert.equal(serializeDesktopHostObservation({ deviceId: "secret" }), null);
});

test(
  "capture roots reject symlink redirection before reading or writing outside the repository",
  { skip: process.platform === "win32" },
  async () => {
    const temporary = await mkdtemp(join(tmpdir(), "evidencespace-capture-"));
    const repository = join(temporary, "repository");
    const outside = join(temporary, "outside");
    try {
      await mkdir(repository);
      await mkdir(outside);

      const safeObservationRoot = join(
        repository,
        ".desktop-build",
        "observations",
      );
      await ensureTrustedDirectoryChain(
        repository,
        safeObservationRoot,
        true,
        "unsafe_draft_path",
      );
      const safeMetadata = await lstat(safeObservationRoot);
      assert.equal(safeMetadata.isDirectory(), true);
      assert.equal(safeMetadata.isSymbolicLink(), false);

      const redirectedParent = join(repository, "redirected");
      await symlink(outside, redirectedParent, "dir");
      await assert.rejects(
        ensureTrustedDirectoryChain(
          repository,
          join(redirectedParent, "observations"),
          true,
          "unsafe_draft_path",
        ),
        (error: unknown) =>
          error instanceof Error &&
          error.message === "unsafe_draft_path" &&
          !error.message.includes(temporary),
      );

      await mkdir(join(repository, "dist"));
      const redirectedArtifactRoot = join(repository, "dist", "electron-spike");
      await symlink(outside, redirectedArtifactRoot, "dir");
      await assert.rejects(
        ensureTrustedDirectoryChain(
          repository,
          redirectedArtifactRoot,
          false,
          "unsafe_artifact_path",
        ),
        (error: unknown) =>
          error instanceof Error &&
          error.message === "unsafe_artifact_path" &&
          !error.message.includes(temporary),
      );
      assert.deepEqual(await readdir(outside), []);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  },
);
