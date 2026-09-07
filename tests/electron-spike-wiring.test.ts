import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const execFileAsync = promisify(execFile);

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("the disposable Electron candidate pins its runtime and packager exactly", async () => {
  const manifest = JSON.parse(await source("desktop/electron/package.json"));
  assert.equal(manifest.devDependencies.electron, "44.2.0");
  assert.equal(manifest.devDependencies["@electron/fuses"], "2.1.3");
  assert.equal(manifest.devDependencies["@electron/packager"], "20.3.0");
  for (const version of Object.values(manifest.devDependencies)) {
    assert.match(String(version), /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  }
  assert.equal(JSON.stringify(manifest.scripts).includes("npx"), false);
});

test("the main process keeps Electron isolation and deny-by-default guards enabled", async () => {
  const main = await source("desktop/electron/main.mjs");
  for (const required of [
    "app.enableSandbox()",
    "contextIsolation: true",
    "sandbox: true",
    "nodeIntegration: false",
    "nodeIntegrationInSubFrames: false",
    "nodeIntegrationInWorker: false",
    "webSecurity: true",
    "allowRunningInsecureContent: false",
    "webviewTag: false",
    "devTools: false",
    "setWindowOpenHandler",
    "will-navigate",
    "will-redirect",
    "will-attach-webview",
    "setPermissionCheckHandler",
    "setPermissionRequestHandler",
    "validateDesktopBridgeRequest",
    "parseDesktopDeepLink",
    'request.payload.caseId !== "C-03"',
    "PACKAGED_CONTENT_SECURITY_POLICY",
  ]) {
    assert.ok(main.includes(required), `missing Electron guard: ${required}`);
  }
  assert.equal(main.includes("shell.openExternal"), false);
});

test("the preload exposes only command-specific methods and never raw Electron primitives", async () => {
  const preload = await source("desktop/electron/preload.cjs");
  assert.ok(preload.includes('contextBridge.exposeInMainWorld("evidenceSpaceDesktop"'));
  assert.ok(preload.includes('invoke("desktop:get-capabilities"'));
  assert.ok(preload.includes('invoke("desktop:select-evidence-files"'));
  assert.equal(preload.includes("sendSync"), false);
  assert.equal(preload.includes("ipcRenderer.on"), false);
  assert.equal(preload.includes("require(\"node:fs\")"), false);
});

test("the package step enables and verifies the required Electron fuses", async () => {
  const packaging = await source("desktop/electron/package-electron-spike.mjs");
  for (const required of [
    "strictlyRequireAllFuses: true",
    "RunAsNode",
    "EnableCookieEncryption",
    "EnableNodeOptionsEnvironmentVariable",
    "EnableNodeCliInspectArguments",
    "EnableEmbeddedAsarIntegrityValidation",
    "OnlyLoadAppFromAsar",
    "LoadBrowserProcessSpecificV8Snapshot",
    "GrantFileProtocolExtraPrivileges",
    "WasmTrapHandlers",
    "asarIntegrityDigest: true",
    "getCurrentFuseWire",
  ]) {
    assert.ok(packaging.includes(required), `missing package hardening: ${required}`);
  }
  assert.ok(packaging.includes('new Set(["darwin:arm64", "darwin:x64", "win32:arm64", "win32:x64"])'));
});

test("the staging script copies an explicit asset allowlist and the compiled shared boundary", async () => {
  const stage = await source("scripts/stage-electron-spike.mjs");
  assert.ok(stage.includes("PACKAGED_WEB_ASSETS"));
  assert.ok(stage.includes("COMPILED_BOUNDARY"));
  assert.ok(stage.includes('join(STAGE_LIB_ROOT, "boundary.js")'));
  assert.ok(stage.includes("isSymbolicLink"));
  assert.equal(stage.includes("cp("), false);
});

test("the durable stage command compiles the shared boundary and emits only expected app files", async () => {
  const repositoryRoot = new URL("..", import.meta.url);
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = await execFileAsync(npm, ["run", "desktop:electron:stage"], {
    cwd: repositoryRoot,
    timeout: 30_000,
  });
  assert.ok(result.stdout.includes("Electron spike staged with 5 allowlisted web assets."));

  const stageRoot = new URL("../.desktop-build/electron/app/", import.meta.url);
  assert.deepEqual((await readdir(stageRoot)).sort(), [
    "lib",
    "main.mjs",
    "package.json",
    "preload.cjs",
    "runtime-policy.mjs",
    "web",
  ]);
  assert.deepEqual(await readdir(new URL("lib/", stageRoot)), ["boundary.js"]);
  assert.equal((await readdir(new URL("web/", stageRoot))).length, 5);
});
