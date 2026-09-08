import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FuseState,
  FuseV1Options,
  FuseVersion,
  flipFuses,
  getCurrentFuseWire,
} from "@electron/fuses";
import { packager } from "@electron/packager";

import { ELECTRON_EXTERNAL_DEEP_LINK_SCHEME } from "./runtime-policy.mjs";

const REPOSITORY_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const STAGE_ROOT = join(REPOSITORY_ROOT, ".desktop-build", "electron", "app");
const OUTPUT_ROOT = join(REPOSITORY_ROOT, "dist", "electron-spike");
const TARGETS = new Set([
  "darwin:arm64",
  "darwin:x64",
  "win32:arm64",
  "win32:x64",
]);
const target = `${process.platform}:${process.arch}`;
const protocolOptions =
  process.platform === "darwin"
    ? {
        appBundleId: "space.evidencespace.spike",
        protocols: [
          {
            name: "EvidenceSpace",
            schemes: [ELECTRON_EXTERNAL_DEEP_LINK_SCHEME],
          },
        ],
      }
    : {};

if (!TARGETS.has(target)) {
  throw new Error(
    "Electron spike packages must be built on Windows or macOS using x64 or arm64.",
  );
}

await mkdir(OUTPUT_ROOT, { recursive: true });
const outputPaths = await packager({
  dir: STAGE_ROOT,
  name: "EvidenceSpaceSpike",
  appVersion: "0.0.0",
  electronVersion: "44.2.0",
  platform: process.platform,
  arch: process.arch,
  out: OUTPUT_ROOT,
  overwrite: true,
  prune: true,
  asar: true,
  asarIntegrityDigest: true,
  ...protocolOptions,
});

const fuseConfiguration = Object.freeze({
  version: FuseVersion.V1,
  strictlyRequireAllFuses: true,
  resetAdHocDarwinSignature:
    process.platform === "darwin" && process.arch === "arm64",
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableCookieEncryption]: true,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: true,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
  [FuseV1Options.WasmTrapHandlers]: true,
});

const expectedFuseStates = new Map([
  [FuseV1Options.RunAsNode, FuseState.DISABLE],
  [FuseV1Options.EnableCookieEncryption, FuseState.ENABLE],
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable, FuseState.DISABLE],
  [FuseV1Options.EnableNodeCliInspectArguments, FuseState.DISABLE],
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation, FuseState.ENABLE],
  [FuseV1Options.OnlyLoadAppFromAsar, FuseState.ENABLE],
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot, FuseState.ENABLE],
  [FuseV1Options.GrantFileProtocolExtraPrivileges, FuseState.DISABLE],
  [FuseV1Options.WasmTrapHandlers, FuseState.ENABLE],
]);

for (const outputPath of outputPaths) {
  const executablePath =
    process.platform === "darwin"
      ? join(outputPath, "EvidenceSpaceSpike.app")
      : join(outputPath, "EvidenceSpaceSpike.exe");
  await flipFuses(executablePath, fuseConfiguration);
  const actualFuses = await getCurrentFuseWire(executablePath);
  for (const [option, expected] of expectedFuseStates) {
    if (actualFuses[option] !== expected) {
      throw new Error(
        `Electron fuse verification failed for option ${String(option)}.`,
      );
    }
  }
}

console.log(
  `Packaged and verified ${outputPaths.length} Electron spike bundle for ${target}.`,
);
