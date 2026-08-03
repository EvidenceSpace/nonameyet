import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("renders scanned-PDF recovery from the shared model", () => {
  assert.match(ui, /getScannedPdfRecovery/);
  assert.match(ui, /imageOcrAvailable: imageOcrReadiness\.available/);
  assert.match(ui, /scannedPdfRecovery\?\.label/);
  assert.match(ui, /scannedPdfRecovery\?\.message/);
});

test("persists a truthful scanned-PDF boundary from processing", () => {
  assert.match(pdf, /SCANNED_PDF_BASE_MESSAGE/);
  assert.match(pdf, /status: "needs_ocr"/);
  assert.match(pdf, /message: SCANNED_PDF_BASE_MESSAGE/);
});
