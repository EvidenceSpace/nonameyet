export const SCANNED_PDF_BASE_MESSAGE = "This PDF appears scanned or has too little selectable text. CaseFind does not yet OCR PDF pages. The original remains stored locally; review it manually.";
export const SCANNED_PDF_IMAGE_RECOVERY_MESSAGE = "For local extraction, export only the pages you need as PNG or JPEG, then add those images as separate records.";
export const SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE = "This browser also cannot run CaseFind’s current local image OCR.";

export function getScannedPdfRecovery({ status, imageOcrAvailable }) {
  if (status !== "needs_ocr") return null;
  const nextStep = imageOcrAvailable ? SCANNED_PDF_IMAGE_RECOVERY_MESSAGE : SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE;
  return {
    status: "needs_ocr",
    label: "Scanned PDF",
    message: `${SCANNED_PDF_BASE_MESSAGE} ${nextStep}`,
    canAnalyze: false,
    canRetryPdfExtraction: false,
    canReviewOriginal: true,
  };
}
