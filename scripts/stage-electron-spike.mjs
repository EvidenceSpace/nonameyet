import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ELECTRON_SPIKE_COMPILED_WEB_ASSETS,
  ELECTRON_SPIKE_GENERATED_FIXTURE_ASSET,
  ELECTRON_SPIKE_RENDERER_ASSETS,
  PACKAGED_SHELL_ASSETS,
  PACKAGED_WEB_ASSETS,
} from "../desktop/electron/runtime-policy.mjs";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = join(REPOSITORY_ROOT, "desktop", "electron");
const RENDERER_ROOT = join(SOURCE_ROOT, "renderer");
const COMPILED_ROOT = join(
  REPOSITORY_ROOT,
  ".desktop-build",
  "electron",
  "compiled",
);
const STAGE_ROOT = join(REPOSITORY_ROOT, ".desktop-build", "electron", "app");
const STAGE_WEB_ROOT = join(STAGE_ROOT, "web");
const STAGE_LIB_ROOT = join(STAGE_ROOT, "lib");
const COMPILED_ASSETS = ELECTRON_SPIKE_COMPILED_WEB_ASSETS;

async function copyRegularFile(source, destination) {
  const metadata = await lstat(source);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error(
      `Refusing non-regular spike input: ${relative(REPOSITORY_ROOT, source)}`,
    );
  }
  await copyFile(source, destination);
}

await rm(STAGE_ROOT, { recursive: true, force: true });
await mkdir(STAGE_WEB_ROOT, { recursive: true });
await mkdir(STAGE_LIB_ROOT, { recursive: true });

for (const fileName of ["main.mjs", "preload.cjs", "runtime-policy.mjs"]) {
  await copyRegularFile(
    join(SOURCE_ROOT, fileName),
    join(STAGE_ROOT, fileName),
  );
}
for (const fileName of COMPILED_ASSETS) {
  await copyRegularFile(
    join(COMPILED_ROOT, fileName),
    join(STAGE_LIB_ROOT, fileName),
  );
  await copyRegularFile(
    join(COMPILED_ROOT, fileName),
    join(STAGE_WEB_ROOT, fileName),
  );
}
for (const fileName of PACKAGED_SHELL_ASSETS) {
  await copyRegularFile(
    join(REPOSITORY_ROOT, "web", fileName),
    join(STAGE_WEB_ROOT, fileName),
  );
}
for (const fileName of ELECTRON_SPIKE_RENDERER_ASSETS) {
  await copyRegularFile(
    join(RENDERER_ROOT, fileName),
    join(STAGE_WEB_ROOT, fileName),
  );
}

const fixtureModule = await import(
  pathToFileURL(join(COMPILED_ROOT, "spike-fixture.js")).href
);
const fixture = await fixtureModule.createDesktopSpikeFixture();
const serializedFixture = fixtureModule.serializeDesktopSpikeFixture(fixture);
const fixtureSha256 = createHash("sha256")
  .update(serializedFixture)
  .digest("hex");
const generatedFixtureModule = [
  `export const DESKTOP_SPIKE_FIXTURE_SHA256 = "${fixtureSha256}";`,
  `export default ${serializedFixture.trimEnd()};`,
  "",
].join("\n");
await writeFile(
  join(STAGE_WEB_ROOT, ELECTRON_SPIKE_GENERATED_FIXTURE_ASSET),
  generatedFixtureModule,
  { encoding: "utf8", mode: 0o600 },
);

const appPackage = {
  name: "evidencespace-electron-spike-app",
  productName: "EvidenceSpaceSpike",
  version: "0.0.0",
  author: { name: "EvidenceSpace" },
  private: true,
  type: "module",
  main: "main.mjs",
};
await writeFile(
  join(STAGE_ROOT, "package.json"),
  `${JSON.stringify(appPackage, null, 2)}\n`,
  "utf8",
);

const stagedBoundary = await readFile(
  join(STAGE_LIB_ROOT, "boundary.js"),
  "utf8",
);
const stagedFixture = await readFile(
  join(STAGE_LIB_ROOT, "spike-fixture.js"),
  "utf8",
);
const stagedMeasurement = await readFile(
  join(STAGE_LIB_ROOT, "spike-measurement.js"),
  "utf8",
);
if (
  !stagedBoundary.includes("validateDesktopBridgeRequest") ||
  !stagedBoundary.includes("parseDesktopDeepLink") ||
  !stagedFixture.includes("createDesktopSpikeFixture") ||
  !stagedMeasurement.includes("validateDesktopSpikeMeasurementFixture") ||
  !stagedMeasurement.includes("summarizeDesktopSpikeFrameSamples")
) {
  throw new Error("Compiled desktop measurement boundary is incomplete.");
}
if (
  fixture.board.objects.length !== 1_000 ||
  fixture.board.connections.length !== 4_000 ||
  fixture.outline.entries.length !== 1_000 ||
  fixture.outline.relations.length !== 4_000 ||
  !PACKAGED_WEB_ASSETS.includes(ELECTRON_SPIKE_GENERATED_FIXTURE_ASSET)
) {
  throw new Error("Generated desktop measurement fixture is incomplete.");
}

console.log(
  `Electron spike staged with ${PACKAGED_WEB_ASSETS.length} allowlisted web assets; fixture ${fixture.board.objects.length} objects, ${fixture.board.connections.length} relationships, sha256 ${fixtureSha256}.`,
);
