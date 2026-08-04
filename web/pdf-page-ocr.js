import { MAX_IMAGE_OCR_CHARACTERS } from "./image-ocr.js";
import { rasterizePdfPage } from "./pdf-page-rasterization.js";
import { browserRasterTextDetectorRuntime } from "./raster-text-detector.js";

export const PDF_PAGE_OCR_TIMEOUT_MS = 30_000;

function pageOcrError(message, code) {
  return Object.assign(new Error(message), { code });
}

function abortError() {
  return new DOMException("cancelled", "AbortError");
}

function abortable(operation, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", handleAbort);
      handler(value);
    };
    const handleAbort = () => finish(reject, abortError());
    signal?.addEventListener("abort", handleAbort, { once: true });
    Promise.resolve(operation).then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}

function deadlineSignal(signal, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw pageOcrError("PDF page OCR timeout is invalid.", "invalid_output");
  }
  const controller = new AbortController();
  let timedOut = false;
  const handleExternalAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", handleExternalAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", handleExternalAbort);
    },
  };
}

function normalizeText(value) {
  return value.normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function validateRuntime(runtime) {
  if (!runtime || typeof runtime.recognizeSource !== "function") {
    throw pageOcrError("Raster OCR adapter is unavailable.", "adapter_unavailable");
  }
  if (typeof runtime.id !== "string" || !runtime.id.trim() || runtime.id.length > 100
    || typeof runtime.version !== "string" || !runtime.version.trim() || runtime.version.length > 100) {
    throw pageOcrError("Raster OCR adapter metadata is invalid.", "invalid_output");
  }
}

function validateResult(result, raster) {
  if (!result || typeof result !== "object" || typeof result.text !== "string") {
    throw pageOcrError("PDF page OCR result is invalid.", "invalid_output");
  }
  if (result.width !== raster.width || result.height !== raster.height) {
    throw pageOcrError("PDF page OCR dimensions do not match the raster source.", "invalid_output");
  }
  if (result.confidence !== undefined
    && (typeof result.confidence !== "number" || !Number.isFinite(result.confidence)
      || result.confidence < 0 || result.confidence > 1)) {
    throw pageOcrError("PDF page OCR confidence is invalid.", "invalid_output");
  }
  if (result.text.length > MAX_IMAGE_OCR_CHARACTERS) {
    throw pageOcrError("PDF page OCR text exceeds the safe limit.", "output_too_large");
  }
  const text = normalizeText(result.text);
  if (!text) throw pageOcrError("PDF page OCR returned empty text.", "empty_text");
  if (text.length > MAX_IMAGE_OCR_CHARACTERS) {
    throw pageOcrError("Normalized PDF page OCR text exceeds the safe limit.", "output_too_large");
  }
  return { text, confidence: result.confidence };
}

export async function ocrPdfPage(page, {
  signal,
  runtime = browserRasterTextDetectorRuntime(),
  timeoutMs = PDF_PAGE_OCR_TIMEOUT_MS,
  rasterize = rasterizePdfPage,
} = {}) {
  validateRuntime(runtime);
  const deadline = deadlineSignal(signal, timeoutMs);
  const workSignal = deadline.signal;
  let raster;
  try {
    const rasterPromise = Promise.resolve(rasterize(page, { signal: workSignal }));
    rasterPromise.then((lateRaster) => {
      if (workSignal.aborted && lateRaster !== raster) lateRaster?.dispose?.();
    }, () => {});
    raster = await abortable(rasterPromise, workSignal);
    if (!raster || typeof raster.dispose !== "function") {
      throw pageOcrError("PDF page raster output is invalid.", "invalid_output");
    }
    const result = await abortable(
      runtime.recognizeSource({ source: raster.source, signal: workSignal }),
      workSignal,
    );
    const validated = validateResult(result, raster);
    return {
      ...validated,
      width: raster.width,
      height: raster.height,
      adapterId: "pdf-page-ocr",
      adapterVersion: `1.0.0+${runtime.id}-${runtime.version}`,
    };
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (deadline.timedOut()) throw pageOcrError("PDF page OCR timed out.", "ocr_timeout");
    throw error;
  } finally {
    deadline.cleanup();
    raster?.dispose?.();
  }
}
