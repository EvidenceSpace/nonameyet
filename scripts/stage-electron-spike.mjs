import { copyFile, lstat, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PACKAGED_WEB_ASSETS } from "../desktop/electron/runtime-policy.mjs";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = join(REPOSITORY_ROOT, "desktop", "electron");
const COMPILED_BOUNDARY = join(REPOSITORY_ROOT, ".desktop-build", "electron", "compiled", "boundary.js");
const STAGE_ROOT = join(REPOSITORY_ROOT, ".desktop-build", "electron", "app");
const STAGE_WEB_ROOT = join(STAGE_ROOT, "web");
const STAGE_LIB_ROOT = join(STAGE_ROOT, "lib");

async function copyRegularFile(source, destination) {
  const metadata = await lstat(source);
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`Refusing non-regular spike input: ${relative(REPOSITORY_ROOT, source)}`);
  await copyFile(source, destination);
}

await rm(STAGE_ROOT, { recursive: true, force: true });
await mkdir(STAGE_WEB_ROOT, { recursive: true });
await mkdir(STAGE_LIB_ROOT, { recursive: true });

for (const fileName of ["main.mjs", "preload.cjs", "runtime-policy.mjs"]) {
  await copyRegularFile(join(SOURCE_ROOT, fileName), join(STAGE_ROOT, fileName));
}
await copyRegularFile(COMPILED_BOUNDARY, join(STAGE_LIB_ROOT, "boundary.js"));
for (const fileName of PACKAGED_WEB_ASSETS) {
  await copyRegularFile(join(REPOSITORY_ROOT, "web", fileName), join(STAGE_WEB_ROOT, fileName));
}

const appPackage = {
  name: "evidencespace-electron-spike-app",
  productName: "EvidenceSpaceSpike",
  version: "0.0.0",
  private: true,
  type: "module",
  main: "main.mjs",
};
await writeFile(join(STAGE_ROOT, "package.json"), `${JSON.stringify(appPackage, null, 2)}\n`, "utf8");

const stagedBoundary = await readFile(join(STAGE_LIB_ROOT, "boundary.js"), "utf8");
if (!stagedBoundary.includes("validateDesktopBridgeRequest") || !stagedBoundary.includes("parseDesktopDeepLink")) {
  throw new Error("Compiled desktop boundary is incomplete.");
}

console.log(`Electron spike staged with ${PACKAGED_WEB_ASSETS.length} allowlisted web assets.`);
