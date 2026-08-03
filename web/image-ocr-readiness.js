export const IMAGE_OCR_UNAVAILABLE_MESSAGE = "Local OCR is unavailable before processing begins. This browser does not provide the on-device text detection CaseFind currently requires. The original remains stored locally; review it manually or try a browser or device with on-device text detection.";

export function inspectImageOcrReadiness(scope = globalThis) {
  const hasTextDetector = typeof scope?.TextDetector === "function";
  const hasImageBitmap = typeof scope?.createImageBitmap === "function";
  if (hasTextDetector && hasImageBitmap) {
    return {
      available: true,
      state: "ready",
      label: "Local OCR ready",
      message: "On-device image text detection is available. Original image bytes stay in this browser.",
    };
  }
  return {
    available: false,
    state: "unavailable",
    label: "Local OCR unavailable",
    message: IMAGE_OCR_UNAVAILABLE_MESSAGE,
    missing: [!hasTextDetector && "text_detector", !hasImageBitmap && "image_decoder"].filter(Boolean),
  };
}

export function canStartImageOcr({ fileType, jobStatus, failureCode, readiness }) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(fileType)) return false;
  if (!readiness?.available) return false;
  return !jobStatus || jobStatus === "failed" || jobStatus === "cancelled";
}
