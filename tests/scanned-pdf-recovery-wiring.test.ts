import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("renders scanned-PDF recovery from persisted bounded failure metadata", () => {
  assert.match(ui, /getScannedPdfRecovery/);
  assert.match(ui, /imageOcrAvailable: imageOcrReadiness\.available/);
  assert.match(ui, /failure: job\?\.failure/);
  assert.match(ui, /scannedPdfRecovery\?\.label/);
  assert.match(ui, /scannedPdfRecovery\?\.message/);
});

test("offers the shared retry action only when the recovery model allows it", () => {
  assert.match(ui, /scannedPdfRecovery\?\.canRetryPdfExtraction/);
  assert.match(ui, /scannedPdfRecovery\?\.retryLabel/);
  assert.match(ui, /processButton\.onclick = \(\) => run\(file/);
  assert.match(ui, /if \(controllers\.has\(file\.id\)\) return/);
});

test("persists a classified scanned-PDF boundary from processing", () => {
  assert.match(pdf, /classifyScannedPdfOcrFailure/);
  assert.match(pdf, /status: "needs_ocr"/);
  assert.match(pdf, /message: SCANNED_PDF_BASE_MESSAGE/);
  assert.match(pdf, /failure: ocrFailure/);
  assert.match(pdf, /code: "ocr_unavailable", retryable: false/);
  assert.match(pdf, /code: "insufficient_text", retryable: false/);
});
