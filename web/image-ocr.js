import { classifyImageOcrFailure } from "./image-ocr-failure-recovery.js";
import { buildImageOcrQuality } from "./image-ocr-quality.js";
import { assertOriginalBytesMatchHash } from "./original-byte-integrity.js";

export const MAX_IMAGE_OCR_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_OCR_PIXELS = 20_000_000;
export const MAX_IMAGE_OCR_EDGE = 10_000;
export const MAX_IMAGE_OCR_CHARACTERS = 200_000;
export const MAX_IMAGE_OCR_BLOCKS = 10_000;
export const MAX_IMAGE_OCR_WARNINGS = 20;
export const MAX_IMAGE_OCR_WARNING_LENGTH = 500;
export const IMAGE_OCR_TIMEOUT_MS = 30_000;

function codedError(message, code) { return Object.assign(new Error(message), { code }); }
function base(file) { return { fileId: file.id, caseId: file.caseId, fileHash: file.sha256, updatedAt: new Date().toISOString() }; }
function detectMimeType(bytes) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
}
function normalizeText(value) { return value.normalize("NFKC").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n").trim(); }

function abortable(operation, signal) {
  if (signal?.aborted) return Promise.reject(new DOMException("cancelled", "AbortError"));
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (handler, value) => { if (settled) return; settled = true; signal?.removeEventListener("abort", onAbort); handler(value); };
    const onAbort = () => finish(reject, new DOMException("cancelled", "AbortError"));
    signal?.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(operation).then((value) => finish(resolve, value), (error) => finish(reject, error));
  });
}

function bounded(operation, signal, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const workController = new AbortController();
    let timer;
    const finish = (handler, value) => { if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener("abort", onAbort); handler(value); };
    const onAbort = () => { workController.abort(); finish(reject, new DOMException("cancelled", "AbortError")); };
    timer = setTimeout(() => { workController.abort(); finish(reject, codedError("Local OCR timed out.", "ocr_timeout")); }, timeoutMs);
    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });
    Promise.resolve().then(() => operation(workController.signal)).then((value) => finish(resolve, value), (error) => finish(reject, error));
  });
}

function validateWarnings(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw codedError("OCR warnings are invalid.", "invalid_output");
  if (value.length > MAX_IMAGE_OCR_WARNINGS) throw codedError("OCR returned too many warnings.", "output_too_large");
  for (const warning of value) {
    if (typeof warning !== "string" || !warning.trim()) throw codedError("OCR warnings are invalid.", "invalid_output");
    if (warning.length > MAX_IMAGE_OCR_WARNING_LENGTH) throw codedError("OCR warning output is too large.", "output_too_large");
  }
  return [...value];
}

export function browserTextDetectorRuntime(scope = globalThis) {
  if (typeof scope.TextDetector !== "function" || typeof scope.createImageBitmap !== "function") return null;
  return { id: "text-detector", version: "1", async recognize({ bytes, mimeType, signal }) {
    if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
    const bitmap = await scope.createImageBitmap(new Blob([bytes], { type: mimeType }));
    try {
      if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
      if (!Number.isInteger(bitmap.width) || !Number.isInteger(bitmap.height) || bitmap.width < 1 || bitmap.height < 1) throw codedError("Invalid image dimensions.", "corrupt_file");
      if (bitmap.width > MAX_IMAGE_OCR_EDGE || bitmap.height > MAX_IMAGE_OCR_EDGE || bitmap.width * bitmap.height > MAX_IMAGE_OCR_PIXELS) throw codedError("Image dimensions exceed the limit.", "file_too_large");
      const blocks = await abortable(new scope.TextDetector().detect(bitmap), signal);
      if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
      if (!Array.isArray(blocks)) throw codedError("OCR blocks are invalid.", "invalid_output");
      if (blocks.length > MAX_IMAGE_OCR_BLOCKS) throw codedError("OCR returned too many text blocks.", "output_too_large");
      let characters = 0;
      for (const block of blocks) {
        if (!block || (block.rawValue !== undefined && typeof block.rawValue !== "string")) throw codedError("OCR block text is invalid.", "invalid_output");
        characters += block.rawValue?.length || 0;
        if (characters > MAX_IMAGE_OCR_CHARACTERS) throw codedError("OCR text exceeds the safe limit.", "output_too_large");
      }
      blocks.sort((a, b) => (a.boundingBox?.y || 0) - (b.boundingBox?.y || 0) || (a.boundingBox?.x || 0) - (b.boundingBox?.x || 0));
      const confidences = blocks.map((block) => block.confidence).filter((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1);
      const confidence = confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : undefined;
      return { text: blocks.map((block) => block.rawValue || "").filter(Boolean).join("\n"), width: bitmap.width, height: bitmap.height, confidence };
    } finally { bitmap.close?.(); }
  } };
}

export async function processImage(file, { signal, runtime = browserTextDetectorRuntime(), timeoutMs = IMAGE_OCR_TIMEOUT_MS, cryptoImpl = globalThis.crypto } = {}) {
  const common = base(file);
  try {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw codedError("Unsupported image type.", "unsupported_type");
    if (file.size > MAX_IMAGE_OCR_BYTES) throw codedError("Image exceeds byte limit.", "file_too_large");
    if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
    const bytes = new Uint8Array(await file.original.arrayBuffer());
    if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
    if (bytes.byteLength !== file.size || detectMimeType(bytes) !== file.type) throw codedError("Stored bytes do not match image record.", "corrupt_file");
    await assertOriginalBytesMatchHash(bytes, file.sha256, { cryptoImpl });
    if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
    if (!runtime) throw codedError("OCR adapter unavailable.", "adapter_unavailable");
    if (typeof runtime.id !== "string" || !runtime.id.trim() || runtime.id.length > 100 || typeof runtime.version !== "string" || !runtime.version.trim() || runtime.version.length > 100) throw codedError("OCR adapter metadata is invalid.", "invalid_output");
    const result = await bounded((workSignal) => runtime.recognize({ bytes, mimeType: file.type, signal: workSignal }), signal, timeoutMs);
    if (signal?.aborted) throw new DOMException("cancelled", "AbortError");
    if (!result || typeof result !== "object" || typeof result.text !== "string") throw codedError("OCR result is invalid.", "invalid_output");
    if (!Number.isInteger(result.width) || !Number.isInteger(result.height) || result.width < 1 || result.height < 1) throw codedError("Invalid OCR dimensions.", "corrupt_file");
    if (result.width > MAX_IMAGE_OCR_EDGE || result.height > MAX_IMAGE_OCR_EDGE || result.width * result.height > MAX_IMAGE_OCR_PIXELS) throw codedError("Image dimensions exceed the limit.", "file_too_large");
    if (result.text.length > MAX_IMAGE_OCR_CHARACTERS) throw codedError("OCR text exceeds the safe limit.", "output_too_large");
    const text = normalizeText(result.text);
    if (text.length > MAX_IMAGE_OCR_CHARACTERS) throw codedError("Normalized OCR text exceeds the safe limit.", "output_too_large");
    if (!text) throw codedError("OCR returned empty text.", "empty_text");
    const quality = buildImageOcrQuality(result.confidence);
    const warnings = validateWarnings(result.warnings);
    if (quality.warning && !warnings.includes(quality.warning)) warnings.push(quality.warning);
    return { ...common, status: "ready_for_ai", message: "Local OCR text is ready for review.", artifact: { adapterId: "local-image-ocr", adapterVersion: `1.0.0+${runtime.id}-${runtime.version}`, pages: [{ pageNumber: 1, text, start: 0, end: text.length }], text, warnings, quality } };
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") return { ...common, status: "cancelled", message: "Local OCR was cancelled.", failure: { code: "cancelled", retryable: false } };
    const failure = classifyImageOcrFailure(error);
    return { ...common, status: "failed", message: failure.message, failure: { code: failure.code, retryable: failure.retryable } };
  }
}
