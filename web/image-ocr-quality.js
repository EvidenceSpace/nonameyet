export const OCR_UNKNOWN_CONFIDENCE_WARNING = "OCR confidence is unavailable. Compare every extracted detail with the original image.";
export const OCR_LOW_CONFIDENCE_WARNING = "OCR confidence is low. Compare every extracted detail with the original image.";
export const OCR_MEDIUM_CONFIDENCE_WARNING = "OCR confidence is moderate. Verify names, dates, reference numbers, and amounts against the original image.";

export function buildImageOcrQuality(value) {
  const confidence = typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
  if (confidence === null) return { confidence, level: "unknown", reviewRequired: true, warning: OCR_UNKNOWN_CONFIDENCE_WARNING };
  if (confidence < 0.7) return { confidence, level: "low", reviewRequired: true, warning: OCR_LOW_CONFIDENCE_WARNING };
  if (confidence < 0.9) return { confidence, level: "medium", reviewRequired: true, warning: OCR_MEDIUM_CONFIDENCE_WARNING };
  return { confidence, level: "high", reviewRequired: true, warning: null };
}

export function formatImageOcrQuality(quality) {
  if (!quality) return "";
  if (quality.confidence === null) return "OCR confidence unavailable";
  return `OCR confidence ${Math.round(quality.confidence * 100)}% · ${quality.level}`;
}
