import assert from "node:assert/strict";
import test from "node:test";
import {
  getScannedPdfRecovery,
  SCANNED_PDF_BASE_MESSAGE,
  SCANNED_PDF_IMAGE_RECOVERY_MESSAGE,
  SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE,
} from "../web/scanned-pdf-recovery.js";

test("returns no recovery guidance outside the scanned-PDF state", () => {
  assert.equal(getScannedPdfRecovery({ status: "unprocessed", imageOcrAvailable: true }), null);
  assert.equal(getScannedPdfRecovery({ status: "ready_for_ai", imageOcrAvailable: true }), null);
});

test("offers a data-minimizing image path only when local image OCR is ready", () => {
  const recovery = getScannedPdfRecovery({ status: "needs_ocr", imageOcrAvailable: true });
  assert.equal(recovery?.label, "Scanned PDF");
  assert.equal(recovery?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_IMAGE_RECOVERY_MESSAGE}`);
  assert.equal(recovery?.canReviewOriginal, true);
  assert.equal(recovery?.canRetryPdfExtraction, false);
  assert.equal(recovery?.canAnalyze, false);
});

test("fails closed when image OCR is unavailable too", () => {
  const recovery = getScannedPdfRecovery({ status: "needs_ocr", imageOcrAvailable: false });
  assert.equal(recovery?.message, `${SCANNED_PDF_BASE_MESSAGE} ${SCANNED_PDF_IMAGE_UNAVAILABLE_MESSAGE}`);
  assert.equal(recovery?.canReviewOriginal, true);
  assert.equal(recovery?.canRetryPdfExtraction, false);
});
