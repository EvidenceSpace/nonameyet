export const SCANNED_PDF_BASE_MESSAGE = "This PDF appears scanned or has too little readable text. CaseFind could not produce AI-ready text from it in this browser session. The original remains stored locally.";
export const SCANNED_PDF_RETRY_MESSAGE = "Local OCR stopped before it could finish. Retry local OCR; CaseFind will re-read the locally stored original without uploading it.";
export const SCANNED_PDF_IMAGE_RECOVERY_MESSAGE = "Local OCR checked this PDF but found too little readable text. Review the original. If the scan is clear, export only the pages you need as PNG or JPEG, then add those images as separate records.";
export const SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE = "This browser cannot run CaseFind’s current local OCR. Review the original manually or use a browser that supports local OCR.";
export const SCANNED_PDF_LIMIT_MESSAGE = "This PDF exceeds CaseFind’s safe local OCR limits. Split out only the pages you need and add those files explicitly.";
export const SCANNED_PDF_INVALID_OUTPUT_MESSAGE = "CaseFind rejected the local OCR output because it was invalid. No extracted text was saved; review the original manually.";
export const SCANNED_PDF_SOURCE_MESSAGE = "CaseFind could not render this PDF safely for local OCR. No extracted text was saved; review the original or add a complete replacement copy explicitly.";

const FAILURE_RULES = Object.freeze({
  ocr_timeout: { retryable: true, guidance: "retry" },
  transient_error: { retryable: true, guidance: "retry" },
  empty_text: { retryable: false, guidance: "no_text" },
  insufficient_text: { retryable: false, guidance: "no_text" },
  ocr_unavailable: { retryable: false, guidance: "unavailable" },
  adapter_unavailable: { retryable: false, guidance: "unavailable" },
  too_many_pages: { retryable: false, guidance: "limit" },
  page_too_large: { retryable: false, guidance: "limit" },
  file_too_large: { retryable: false, guidance: "limit" },
  output_too_large: { retryable: false, guidance: "limit" },
  invalid_output: { retryable: false, guidance: "invalid_output" },
  corrupt_file: { retryable: false, guidance: "source" },
});

export function normalizeScannedPdfOcrFailure(failure) {
  if (!failure || typeof failure !== "object" || Array.isArray(failure)) return null;
  if (typeof failure.code !== "string" || !Object.hasOwn(FAILURE_RULES, failure.code)) return null;
  const rule = FAILURE_RULES[failure.code];
  return { code: failure.code, retryable: rule.retryable };
}

export function classifyScannedPdfOcrFailure(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  if (["ocr_timeout", "processing_timeout"].includes(code)) {
    return { code: "ocr_timeout", retryable: true };
  }
  if ([
    "empty_text",
    "too_many_pages",
    "page_too_large",
    "file_too_large",
    "output_too_large",
    "invalid_output",
    "corrupt_file",
    "adapter_unavailable",
  ].includes(code)) {
    return normalizeScannedPdfOcrFailure({ code });
  }
  return { code: "transient_error", retryable: true };
}

export function getScannedPdfRecovery({ status, imageOcrAvailable, failure } = {}) {
  if (status !== "needs_ocr") return null;
  const normalizedFailure = normalizeScannedPdfOcrFailure(failure);
  const guidance = normalizedFailure ? FAILURE_RULES[normalizedFailure.code].guidance : "legacy";
  let nextStep;
  if (guidance === "retry") nextStep = SCANNED_PDF_RETRY_MESSAGE;
  else if (guidance === "unavailable") nextStep = SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE;
  else if (guidance === "limit") nextStep = SCANNED_PDF_LIMIT_MESSAGE;
  else if (guidance === "invalid_output") nextStep = SCANNED_PDF_INVALID_OUTPUT_MESSAGE;
  else if (guidance === "source") nextStep = SCANNED_PDF_SOURCE_MESSAGE;
  else nextStep = imageOcrAvailable === true
    ? SCANNED_PDF_IMAGE_RECOVERY_MESSAGE
    : SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE;
  const canRetryPdfExtraction = normalizedFailure?.retryable === true;
  return {
    status: "needs_ocr",
    label: "Scanned PDF",
    message: `${SCANNED_PDF_BASE_MESSAGE} ${nextStep}`,
    canAnalyze: false,
    canRetryPdfExtraction,
    retryLabel: canRetryPdfExtraction ? "Retry local OCR" : null,
    canReviewOriginal: true,
  };
}
