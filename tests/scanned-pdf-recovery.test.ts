import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyScannedPdfOcrFailure,
  getScannedPdfRecovery,
  normalizeScannedPdfOcrFailure,
  SCANNED_PDF_BASE_MESSAGE,
  SCANNED_PDF_IMAGE_RECOVERY_MESSAGE,
  SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE,
  SCANNED_PDF_INVALID_OUTPUT_MESSAGE,
  SCANNED_PDF_LIMIT_MESSAGE,
  SCANNED_PDF_RETRY_MESSAGE,
  SCANNED_PDF_SOURCE_MESSAGE,
} from "../web/scanned-pdf-recovery.js";

test("returns no recovery guidance outside the scanned-PDF state", () => {
  assert.equal(getScannedPdfRecovery({ status: "unprocessed", imageOcrAvailable: true }), null);
  assert.equal(getScannedPdfRecovery({ status: "ready_for_ai", imageOcrAvailable: true }), null);
});

test("classifies only transient OCR failures as retryable", () => {
  assert.deepEqual(classifyScannedPdfOcrFailure(Object.assign(new Error("late"), { code: "ocr_timeout" })), {
    code: "ocr_timeout", retryable: true,
  });
  assert.deepEqual(classifyScannedPdfOcrFailure(new Error("detector reset")), {
    code: "transient_error", retryable: true,
  });
  for (const code of [
    "empty_text",
    "too_many_pages",
    "page_too_large",
    "file_too_large",
    "output_too_large",
    "invalid_output",
    "corrupt_file",
    "adapter_unavailable",
  ]) {
    assert.deepEqual(classifyScannedPdfOcrFailure(Object.assign(new Error(code), { code })), {
      code, retryable: false,
    });
  }
});

test("offers an explicit local retry only for a recognized transient failure", () => {
  const recovery = getScannedPdfRecovery({
    status: "needs_ocr",
    imageOcrAvailable: true,
    failure: { code: "ocr_timeout", retryable: false },
  });
  assert.equal(recovery?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_RETRY_MESSAGE}`);
  assert.equal(recovery?.canRetryPdfExtraction, true);
  assert.equal(recovery?.retryLabel, "Retry local OCR");
  assert.equal(recovery?.canAnalyze, false);
  assert.equal(recovery?.canReviewOriginal, true);
});

test("fails closed for legacy, unknown, and contradictory stored failure metadata", () => {
  assert.equal(normalizeScannedPdfOcrFailure({ code: "empty_text", retryable: true })?.retryable, false);
  assert.equal(normalizeScannedPdfOcrFailure({ code: "made_up", retryable: true }), null);
  assert.equal(normalizeScannedPdfOcrFailure({ code: "__proto__", retryable: true }), null);
  assert.equal(normalizeScannedPdfOcrFailure({ code: "constructor", retryable: true }), null);
  for (const failure of [undefined, { code: "made_up", retryable: true }, "ocr_timeout"]) {
    const recovery = getScannedPdfRecovery({ status: "needs_ocr", imageOcrAvailable: true, failure });
    assert.equal(recovery?.canRetryPdfExtraction, false);
    assert.equal(recovery?.retryLabel, null);
  }
});

test("uses truthful no-text and unavailable fallbacks without offering retry", () => {
  const noText = getScannedPdfRecovery({
    status: "needs_ocr",
    imageOcrAvailable: true,
    failure: { code: "empty_text", retryable: true },
  });
  assert.equal(noText?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_IMAGE_RECOVERY_MESSAGE}`);
  assert.equal(noText?.canRetryPdfExtraction, false);

  const unavailable = getScannedPdfRecovery({
    status: "needs_ocr",
    imageOcrAvailable: false,
    failure: { code: "ocr_unavailable", retryable: true },
  });
  assert.equal(unavailable?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE}`);
  assert.equal(unavailable?.canRetryPdfExtraction, false);
});

test("explains permanent OCR limits and rejected output separately", () => {
  const limited = getScannedPdfRecovery({
    status: "needs_ocr",
    imageOcrAvailable: true,
    failure: { code: "too_many_pages", retryable: true },
  });
  assert.equal(limited?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_LIMIT_MESSAGE}`);
  assert.equal(limited?.canRetryPdfExtraction, false);

  const invalid = getScannedPdfRecovery({
    status: "needs_ocr",
    imageOcrAvailable: true,
    failure: { code: "invalid_output", retryable: true },
  });
  assert.equal(invalid?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_INVALID_OUTPUT_MESSAGE}`);
  assert.equal(invalid?.canRetryPdfExtraction, false);

  const corrupt = getScannedPdfRecovery({
    status: "needs_ocr",
    imageOcrAvailable: true,
    failure: { code: "corrupt_file", retryable: true },
  });
  assert.equal(corrupt?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_SOURCE_MESSAGE}`);
  assert.equal(corrupt?.canRetryPdfExtraction, false);
});
