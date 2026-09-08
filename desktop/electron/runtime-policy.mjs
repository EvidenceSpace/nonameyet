import { extname } from "node:path";

export const ELECTRON_SPIKE_RUNTIME_VERSION = "electron-spike.v1";
export const ELECTRON_APP_SCHEME = "evidencespace-app";
export const ELECTRON_APP_HOST = "app";
export const ELECTRON_APP_ORIGIN = `${ELECTRON_APP_SCHEME}://${ELECTRON_APP_HOST}`;
export const ELECTRON_SHELL_PATH = "/evidencespace-shell.html";
export const ELECTRON_BOARD_MEASUREMENT_PATH = "/desktop-spike-board.html";
export const ELECTRON_BOARD_MEASUREMENT_FLAG = "--evidencespace-measure-board";

export const PACKAGED_SHELL_ASSETS = Object.freeze([
  "evidencespace-shell.html",
  "evidencespace-shell.css",
  "evidencespace-shell.js",
  "evidencespace-shell-model.js",
  "evidencespace-tokens.css",
]);
export const ELECTRON_SPIKE_RENDERER_ASSETS = Object.freeze([
  "desktop-spike-board.html",
  "desktop-spike-board.css",
  "desktop-spike-board.js",
]);
export const ELECTRON_SPIKE_COMPILED_WEB_ASSETS = Object.freeze([
  "boundary.js",
  "spike-evidence.js",
  "spike-fixture.js",
  "spike-measurement.js",
]);
export const ELECTRON_SPIKE_GENERATED_FIXTURE_ASSET =
  "desktop-spike-fixture.js";
export const PACKAGED_WEB_ASSETS = Object.freeze([
  ...PACKAGED_SHELL_ASSETS,
  ...ELECTRON_SPIKE_RENDERER_ASSETS,
  ...ELECTRON_SPIKE_COMPILED_WEB_ASSETS,
  ELECTRON_SPIKE_GENERATED_FIXTURE_ASSET,
]);

export const PACKAGED_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'none'",
  "font-src 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "img-src 'self' data:",
  "media-src 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "worker-src 'none'",
].join("; ");

const CONTENT_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
});
const SAFE_HANDLE = /^evidence_[a-z0-9]{16,48}$/;
const IMAGE_EXTENSIONS = new Set([
  ".heic",
  ".heif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function parseAppUrl(input) {
  if (typeof input !== "string" || input.length > 2_048) return null;

  try {
    const url = new URL(input);
    if (
      url.protocol !== `${ELECTRON_APP_SCHEME}:` ||
      url.hostname !== ELECTRON_APP_HOST ||
      url.username !== "" ||
      url.password !== "" ||
      url.port !== "" ||
      url.hash !== ""
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function resolvePackagedAsset(input) {
  const url = parseAppUrl(input);
  if (!url) return null;

  let fileName;
  try {
    fileName = decodeURIComponent(url.pathname.slice(1));
  } catch {
    return null;
  }

  if (!PACKAGED_WEB_ASSETS.includes(fileName)) return null;
  if (fileName !== "evidencespace-shell.html" && url.search !== "") {
    return null;
  }

  return Object.freeze({
    fileName,
    contentType: CONTENT_TYPES[extname(fileName)] ?? "application/octet-stream",
  });
}

export function shellUrlToDesktopDeepLink(input) {
  const asset = resolvePackagedAsset(input);
  if (!asset || asset.fileName !== "evidencespace-shell.html") return null;
  const url = parseAppUrl(input);
  if (!url) return null;
  return `evidencespace://open${url.search || "?route=home"}`;
}

export function buildShellUrlFromHref(href) {
  if (typeof href !== "string" || !href.startsWith(`${ELECTRON_SHELL_PATH}?`)) {
    return null;
  }
  const url = new URL(href, `${ELECTRON_APP_ORIGIN}/`);
  const asset = resolvePackagedAsset(url.toString());
  return asset?.fileName === "evidencespace-shell.html" ? url.toString() : null;
}

export function buildBoardMeasurementUrl() {
  return `${ELECTRON_APP_ORIGIN}${ELECTRON_BOARD_MEASUREMENT_PATH}`;
}

export function isBoardMeasurementUrl(input) {
  const asset = resolvePackagedAsset(input);
  if (!asset || asset.fileName !== "desktop-spike-board.html") return false;
  const url = parseAppUrl(input);
  return url?.search === "";
}

export function buildPickerFilters(kinds) {
  if (!Array.isArray(kinds)) return [];
  const filters = [];
  if (kinds.includes("pdf")) {
    filters.push({ name: "PDF documents", extensions: ["pdf"] });
  }
  if (kinds.includes("image")) {
    filters.push({
      name: "Images",
      extensions: ["png", "jpg", "jpeg", "heic", "heif", "webp"],
    });
  }
  return filters;
}

function evidenceKindForPath(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  return null;
}

export function createOpaqueEvidenceSelection(filePaths, kinds, createHandle) {
  if (
    !Array.isArray(filePaths) ||
    filePaths.length > 64 ||
    !Array.isArray(kinds) ||
    typeof createHandle !== "function"
  ) {
    throw new TypeError("Invalid picker result.");
  }

  const requestedKinds = new Set(kinds);
  const seenPaths = new Set();
  const seenHandles = new Set();
  const rendererFiles = [];
  const hostFiles = new Map();

  for (const filePath of filePaths) {
    if (typeof filePath !== "string" || seenPaths.has(filePath)) continue;
    seenPaths.add(filePath);
    const kind = evidenceKindForPath(filePath);
    if (!kind || !requestedKinds.has(kind)) continue;

    const handle = createHandle(rendererFiles.length);
    if (
      typeof handle !== "string" ||
      !SAFE_HANDLE.test(handle) ||
      seenHandles.has(handle)
    ) {
      throw new TypeError("Invalid opaque handle.");
    }
    seenHandles.add(handle);
    rendererFiles.push(Object.freeze({ handle, kind }));
    hostFiles.set(handle, filePath);
  }

  return Object.freeze({
    rendererFiles: Object.freeze(rendererFiles),
    hostFiles,
  });
}

export function authorizeSyntheticSpikeTarget(target) {
  if (!target || typeof target !== "object") return false;
  if (target.kind === "global") return true;
  return target.kind === "case" && target.caseId === "C-03";
}
