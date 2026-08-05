import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("persists bounded OCR failure metadata with an otherwise valid mixed-PDF artifact", () => {
  assert.match(pdf, /\.\.\.\(ocrFailure \? \{ failure: ocrFailure \} : \{\}\)/);
});

test("wires a distinct non-destructive retry action for mixed PDFs", () => {
  assert.match(ui, /getMixedPdfOcrRetry/);
  assert.match(ui, /resolveMixedPdfOcrRetry/);
  assert.match(ui, /mixedPdfRetryRuns/);
  assert.match(ui, /processingNotices/);
  assert.match(ui, /preserveJob: job/);
  assert.match(ui, /mixedPdfRetry\?\.retryLabel/);
});

test("does not overwrite the persisted artifact before a preserved retry improves it", () => {
  assert.match(ui, /if \(!preserveExisting\) \{[\s\S]*?runMarker = \{[\s\S]*?status: "extracting"[\s\S]*?await saveProcessing\(runMarker\)/);
  assert.match(ui, /if \(outcome\.replaceExisting\) \{[\s\S]*?saveProcessingIfCurrent\(preserveJob, result\)/);
  assert.match(ui, /MIXED_PDF_OCR_RETRY_FAILED_MESSAGE/);
});

test("keeps cancellation and duplicate-run protection during preserved retries", () => {
  assert.match(ui, /if \(controllers\.has\(file\.id\)\) return/);
  assert.match(ui, /mixedPdfRetryRuns\.add\(file\.id\)/);
  assert.match(ui, /mixedPdfRetryRuns\.delete\(file\.id\)/);
  assert.match(ui, /controllers\.get\(file\.id\)\?\.abort\(\)/);
});
