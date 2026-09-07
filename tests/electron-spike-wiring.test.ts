import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

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
  assert.equal(
    manifest.scripts["measure:staged"],
    "electron ../../.desktop-build/electron/app --evidencespace-measure-board",
  );
});

test("the main process keeps isolation and separates measurement from bridge authorization", async () => {
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
    "ELECTRON_BOARD_MEASUREMENT_FLAG",
    "buildBoardMeasurementUrl",
    "isBoardMeasurementUrl",
    "parseAuthorizedShellUrl(senderUrl)",
  ]) {
    assert.ok(main.includes(required), `missing Electron guard: ${required}`);
  }
  assert.equal(main.includes("shell.openExternal"), false);
});

test("the preload exposes only command-specific methods and never raw Electron primitives", async () => {
  const preload = await source("desktop/electron/preload.cjs");
  assert.ok(
    preload.includes('contextBridge.exposeInMainWorld("evidenceSpaceDesktop"'),
  );
  assert.ok(preload.includes('invoke("desktop:get-capabilities"'));
  assert.ok(preload.includes('invoke("desktop:select-evidence-files"'));
  assert.equal(preload.includes("sendSync"), false);
  assert.equal(preload.includes("ipcRenderer.on"), false);
  assert.equal(preload.includes('require("node:fs")'), false);
});

test("the Board renderer uses bounded samples and text-only outline construction", async () => {
  const renderer = await source(
    "desktop/electron/renderer/desktop-spike-board.js",
  );
  for (const required of [
    "validateDesktopSpikeMeasurementFixture",
    "summarizeDesktopSpikeFrameSamples",
    "DESKTOP_SPIKE_FRAME_SAMPLE_COUNT",
    "DESKTOP_SPIKE_FRAME_WARMUP_COUNT",
    "DESKTOP_SPIKE_FRAME_TIMEOUT_MS",
    "requestAnimationFrame",
    "textContent",
    "createDocumentFragment",
  ]) {
    assert.ok(
      renderer.includes(required),
      `missing renderer behavior: ${required}`,
    );
  }
  assert.equal(renderer.includes("innerHTML"), false);
  assert.equal(renderer.includes("localStorage"), false);
  assert.equal(renderer.includes("sessionStorage"), false);
  assert.equal(renderer.includes("fetch("), false);
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
    assert.ok(
      packaging.includes(required),
      `missing package hardening: ${required}`,
    );
  }
  assert.ok(
    packaging.includes(
      '["darwin:arm64", "darwin:x64", "win32:arm64", "win32:x64"]',
    ) || packaging.includes('"darwin:arm64",'),
  );
});

test("the staging script copies explicit assets, compiled contracts, and generated fixture", async () => {
  const stage = await source("scripts/stage-electron-spike.mjs");
  for (const required of [
    "PACKAGED_SHELL_ASSETS",
    "ELECTRON_SPIKE_RENDERER_ASSETS",
    "ELECTRON_SPIKE_COMPILED_WEB_ASSETS",
    "ELECTRON_SPIKE_GENERATED_FIXTURE_ASSET",
    "COMPILED_ASSETS",
    "createDesktopSpikeFixture",
    "serializeDesktopSpikeFixture",
    "fixtureSha256",
    "isSymbolicLink",
  ]) {
    assert.ok(stage.includes(required), `missing stage behavior: ${required}`);
  }
  assert.equal(stage.includes("cp("), false);
});

test("the durable stage command emits only the expected app and measurement files", async () => {
  const repositoryRoot = new URL("..", import.meta.url);
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = await execFileAsync(npm, ["run", "desktop:electron:stage"], {
    cwd: repositoryRoot,
    timeout: 30_000,
  });
  assert.match(
    result.stdout,
    /Electron spike staged with 13 allowlisted web assets; fixture 1000 objects, 4000 relationships, sha256 [a-f0-9]{64}\./,
  );

  const stageRoot = new URL("../.desktop-build/electron/app/", import.meta.url);
  assert.deepEqual((await readdir(stageRoot)).sort(), [
    "lib",
    "main.mjs",
    "package.json",
    "preload.cjs",
    "runtime-policy.mjs",
    "web",
  ]);
  assert.deepEqual((await readdir(new URL("lib/", stageRoot))).sort(), [
    "boundary.js",
    "spike-evidence.js",
    "spike-fixture.js",
    "spike-measurement.js",
  ]);
  assert.deepEqual((await readdir(new URL("web/", stageRoot))).sort(), [
    "boundary.js",
    "desktop-spike-board.css",
    "desktop-spike-board.html",
    "desktop-spike-board.js",
    "desktop-spike-fixture.js",
    "evidencespace-shell-model.js",
    "evidencespace-shell.css",
    "evidencespace-shell.html",
    "evidencespace-shell.js",
    "evidencespace-tokens.css",
    "spike-evidence.js",
    "spike-fixture.js",
    "spike-measurement.js",
  ]);

  const generated = await import(
    `${new URL("web/desktop-spike-fixture.js", stageRoot).href}?test=${Date.now()}`
  );
  assert.match(generated.DESKTOP_SPIKE_FIXTURE_SHA256, /^[a-f0-9]{64}$/);
  assert.equal(generated.default.board.objects.length, 1_000);
  assert.equal(generated.default.board.connections.length, 4_000);
  assert.equal(generated.default.outline.entries.length, 1_000);
  assert.equal(generated.default.outline.relations.length, 4_000);
});
