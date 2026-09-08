import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { digestDesktopPackagedArtifact } from "../scripts/desktop-artifact-digest.mjs";
import { DESKTOP_ARTIFACT_DIGEST_ALGORITHM } from "../src/desktop/spike-evidence.js";

async function createArtifact(
  root: string,
  order: "forward" | "reverse",
): Promise<void> {
  await mkdir(join(root, "resources"), { recursive: true });
  const files = [
    [join(root, "EvidenceSpaceSpike.bin"), "runtime"],
    [join(root, "resources", "app.asar"), "application"],
  ] as const;
  if (order === "reverse") files.reverse();
  for (const [path, content] of files) await writeFile(path, content);
}

test("the packaged tree digest is deterministic and excludes host paths", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "evidencespace-artifact-"));
  const first = join(temporary, "first");
  const second = join(temporary, "second");
  try {
    await createArtifact(first, "forward");
    await createArtifact(second, "reverse");
    const earlier = new Date("2026-09-01T00:00:00.000Z");
    const later = new Date("2026-09-02T00:00:00.000Z");
    await utimes(join(first, "EvidenceSpaceSpike.bin"), earlier, earlier);
    await utimes(join(second, "EvidenceSpaceSpike.bin"), later, later);

    const left = await digestDesktopPackagedArtifact(first);
    const right = await digestDesktopPackagedArtifact(second);
    assert.deepEqual(left, right);
    assert.equal(left.algorithm, DESKTOP_ARTIFACT_DIGEST_ALGORITHM);
    assert.match(left.artifactSha256, /^[a-f0-9]{64}$/);
    assert.equal(left.packagedArtifactBytes, 18);
    assert.equal(left.entryCount, 3);
    assert.equal(JSON.stringify(left).includes(temporary), false);
    assert.equal(JSON.stringify(left).includes("app.asar"), false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("changing one packaged byte changes the digest", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "evidencespace-artifact-"));
  const artifact = join(temporary, "bundle");
  try {
    await createArtifact(artifact, "forward");
    const before = await digestDesktopPackagedArtifact(artifact);
    await writeFile(join(artifact, "resources", "app.asar"), "applicatioN");
    const after = await digestDesktopPackagedArtifact(artifact);
    assert.notEqual(before.artifactSha256, after.artifactSha256);
    assert.equal(before.packagedArtifactBytes, after.packagedArtifactBytes);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test(
  "artifact symlinks cannot escape the measured package",
  { skip: process.platform === "win32" },
  async () => {
    const temporary = await mkdtemp(join(tmpdir(), "evidencespace-artifact-"));
    const artifact = join(temporary, "bundle");
    try {
      await mkdir(artifact, { recursive: true });
      await writeFile(join(temporary, "outside"), "private-host-data");
      await writeFile(join(artifact, "app.asar"), "application");
      await symlink("../outside", join(artifact, "unsafe-link"));
      await assert.rejects(
        digestDesktopPackagedArtifact(artifact),
        (error: unknown) =>
          error instanceof TypeError &&
          error.message === "unsafe_artifact_symlink" &&
          !error.message.includes(temporary),
      );
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  },
);

test("empty directories and ordinary files fail closed as artifact roots", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "evidencespace-artifact-"));
  try {
    const empty = join(temporary, "empty");
    const file = join(temporary, "file");
    await mkdir(empty);
    await writeFile(file, "not-a-package");
    await assert.rejects(digestDesktopPackagedArtifact(empty), {
      message: "empty_artifact",
    });
    await assert.rejects(digestDesktopPackagedArtifact(file), {
      message: "invalid_artifact_root",
    });
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
