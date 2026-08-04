import {
  MAX_IMAGE_OCR_BLOCKS,
  MAX_IMAGE_OCR_CHARACTERS,
  MAX_IMAGE_OCR_EDGE,
  MAX_IMAGE_OCR_PIXELS,
} from "./image-ocr.js";

function detectorError(message, code) {
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

function validateSource(source) {
  const width = source?.width;
  const height = source?.height;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw detectorError("Raster source dimensions are invalid.", "corrupt_file");
  }
  if (width > MAX_IMAGE_OCR_EDGE || height > MAX_IMAGE_OCR_EDGE || width * height > MAX_IMAGE_OCR_PIXELS) {
    throw detectorError("Raster source dimensions exceed the OCR limit.", "file_too_large");
  }
  return { width, height };
}

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks)) throw detectorError("OCR blocks are invalid.", "invalid_output");
  if (blocks.length > MAX_IMAGE_OCR_BLOCKS) {
    throw detectorError("OCR returned too many text blocks.", "output_too_large");
  }
  let characters = 0;
  for (const block of blocks) {
    if (!block || (block.rawValue !== undefined && typeof block.rawValue !== "string")) {
      throw detectorError("OCR block text is invalid.", "invalid_output");
    }
    characters += block.rawValue?.length || 0;
    if (characters > MAX_IMAGE_OCR_CHARACTERS) {
      throw detectorError("OCR text exceeds the safe limit.", "output_too_large");
    }
  }
  blocks.sort((a, b) => (a.boundingBox?.y || 0) - (b.boundingBox?.y || 0)
    || (a.boundingBox?.x || 0) - (b.boundingBox?.x || 0));
  const confidences = blocks
    .map((block) => block.confidence)
    .filter((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1);
  return {
    text: blocks.map((block) => block.rawValue || "").filter(Boolean).join("\n"),
    confidence: confidences.length
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : undefined,
  };
}

export function browserRasterTextDetectorRuntime(scope = globalThis) {
  if (typeof scope.TextDetector !== "function") return null;
  return {
    id: "text-detector-raster",
    version: "1",
    async recognizeSource({ source, signal }) {
      if (signal?.aborted) throw abortError();
      const dimensions = validateSource(source);
      const blocks = await abortable(new scope.TextDetector().detect(source), signal);
      if (signal?.aborted) throw abortError();
      return { ...normalizeBlocks(blocks), ...dimensions };
    },
  };
}
