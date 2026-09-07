import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  protocol,
  session,
} from "electron";

import {
  DESKTOP_PROTOCOL_VERSION,
  parseDesktopDeepLink,
  validateDesktopBridgeRequest,
} from "./lib/boundary.js";
import {
  ELECTRON_APP_SCHEME,
  ELECTRON_BOARD_MEASUREMENT_FLAG,
  ELECTRON_SPIKE_RUNTIME_VERSION,
  PACKAGED_CONTENT_SECURITY_POLICY,
  authorizeSyntheticSpikeTarget,
  buildBoardMeasurementUrl,
  buildPickerFilters,
  buildShellUrlFromHref,
  createOpaqueEvidenceSelection,
  isBoardMeasurementUrl,
  resolvePackagedAsset,
  shellUrlToDesktopDeepLink,
} from "./runtime-policy.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(ROOT, "web");
const IPC_CHANNEL = "evidencespace:desktop:v1";
const selectedFileHandles = new Map();
const boardMeasurementMode = process.argv.includes(
  ELECTRON_BOARD_MEASUREMENT_FLAG,
);
let mainWindow = null;
let pendingDeepLink =
  process.argv.find((value) => value.startsWith("evidencespace://")) ?? null;

protocol.registerSchemesAsPrivileged([
  {
    scheme: ELECTRON_APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      codeCache: true,
    },
  },
]);
app.enableSandbox();

function responseHeaders(contentType) {
  return {
    "content-type": contentType,
    "content-security-policy": PACKAGED_CONTENT_SECURITY_POLICY,
    "cross-origin-opener-policy": "same-origin",
    "permissions-policy":
      "camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  };
}

async function registerPackagedContentProtocol() {
  await protocol.handle(ELECTRON_APP_SCHEME, async (request) => {
    if (request.method !== "GET") return new Response(null, { status: 405 });
    const asset = resolvePackagedAsset(request.url);
    if (!asset) return new Response(null, { status: 404 });

    try {
      const body = await readFile(join(WEB_ROOT, asset.fileName));
      return new Response(body, {
        status: 200,
        headers: responseHeaders(asset.contentType),
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
}

function parseAuthorizedShellUrl(url) {
  const deepLink = shellUrlToDesktopDeepLink(url);
  if (!deepLink) return null;
  const parsed = parseDesktopDeepLink(deepLink);
  return parsed.ok && authorizeSyntheticSpikeTarget(parsed.value)
    ? parsed.value
    : null;
}

function isAuthorizedWindowUrl(url) {
  return parseAuthorizedShellUrl(url) !== null || isBoardMeasurementUrl(url);
}

function hardenWebContents(contents) {
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  contents.on("will-navigate", (event, url) => {
    if (!isAuthorizedWindowUrl(url)) event.preventDefault();
  });
  contents.on("will-redirect", (event, url) => {
    if (!isAuthorizedWindowUrl(url)) event.preventDefault();
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());
  contents.on("render-process-gone", () => selectedFileHandles.clear());
}

function fixedFailure(requestId, code) {
  return Object.freeze({
    protocolVersion: DESKTOP_PROTOCOL_VERSION,
    requestId,
    ok: false,
    error: Object.freeze({ code }),
  });
}

function fixedSuccess(requestId, value) {
  return Object.freeze({
    protocolVersion: DESKTOP_PROTOCOL_VERSION,
    requestId,
    ok: true,
    value,
  });
}

async function selectEvidenceFiles(request) {
  const options = {
    title: "Select evidence",
    properties: request.payload.multiple
      ? ["openFile", "multiSelections", "dontAddToRecent"]
      : ["openFile", "dontAddToRecent"],
    filters: buildPickerFilters(request.payload.kinds),
  };
  const result = await dialog.showOpenDialog(mainWindow, options);
  if (result.canceled) {
    return fixedSuccess(
      request.requestId,
      Object.freeze({ files: Object.freeze([]) }),
    );
  }

  const selection = createOpaqueEvidenceSelection(
    request.payload.multiple ? result.filePaths : result.filePaths.slice(0, 1),
    request.payload.kinds,
    () => `evidence_${randomUUID().replaceAll("-", "")}`,
  );
  for (const [handle, filePath] of selection.hostFiles) {
    selectedFileHandles.set(
      handle,
      Object.freeze({ caseId: request.payload.caseId, filePath }),
    );
  }
  return fixedSuccess(
    request.requestId,
    Object.freeze({ files: selection.rendererFiles }),
  );
}

function installBridgeHandler() {
  ipcMain.handle(IPC_CHANNEL, async (event, input) => {
    const senderUrl = event.senderFrame?.url ?? event.sender.getURL();
    if (!parseAuthorizedShellUrl(senderUrl)) {
      return fixedFailure("rejected", "invalid_sender");
    }

    const parsed = validateDesktopBridgeRequest(input);
    if (!parsed.ok) return fixedFailure("rejected", "invalid_request");
    const request = parsed.value;
    if (
      request.command === "desktop:select-evidence-files" &&
      request.payload.caseId !== "C-03"
    ) {
      return fixedFailure(request.requestId, "unauthorized_target");
    }

    if (request.command === "desktop:get-capabilities") {
      return fixedSuccess(
        request.requestId,
        Object.freeze({
          runtime: ELECTRON_SPIKE_RUNTIME_VERSION,
          candidate: "electron",
          hostVersion: process.versions.electron,
          packaged: app.isPackaged,
          absolutePathsExposed: false,
          rawBridgeExposed: false,
          commands: Object.freeze([
            "desktop:get-capabilities",
            "desktop:select-evidence-files",
          ]),
        }),
      );
    }

    try {
      return await selectEvidenceFiles(request);
    } catch {
      return fixedFailure(request.requestId, "picker_failed");
    }
  });
}

function handleDeepLink(input) {
  if (!mainWindow || typeof input !== "string") return false;
  const parsed = parseDesktopDeepLink(input);
  if (!parsed.ok || !authorizeSyntheticSpikeTarget(parsed.value)) return false;
  const shellUrl = buildShellUrlFromHref(parsed.value.href);
  if (!shellUrl) return false;
  void mainWindow.loadURL(shellUrl);
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  return true;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: boardMeasurementMode
      ? "EvidenceSpace Board measurement"
      : "EvidenceSpace desktop spike",
    width: 1440,
    height: 900,
    minWidth: 520,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#f5f6f8",
    webPreferences: {
      preload: join(ROOT, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: false,
      safeDialogs: true,
      spellcheck: false,
    },
  });
  mainWindow.removeMenu();
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
    selectedFileHandles.clear();
  });

  const initialUrl = boardMeasurementMode
    ? buildBoardMeasurementUrl()
    : buildShellUrlFromHref("/evidencespace-shell.html?route=home");
  if (!initialUrl) throw new Error("Electron spike initial URL is invalid.");
  await mainWindow.loadURL(initialUrl);

  if (pendingDeepLink) {
    handleDeepLink(pendingDeepLink);
    pendingDeepLink = null;
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const deepLink = commandLine.find((value) =>
      value.startsWith("evidencespace://"),
    );
    if (deepLink) handleDeepLink(deepLink);
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (!handleDeepLink(url)) pendingDeepLink = url;
  });
  app.on("web-contents-created", (_event, contents) =>
    hardenWebContents(contents),
  );
  app.on("window-all-closed", () => {
    selectedFileHandles.clear();
    if (process.platform !== "darwin") app.quit();
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });

  app.whenReady().then(async () => {
    await registerPackagedContentProtocol();
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false),
    );
    installBridgeHandler();
    await createWindow();
  });
}
