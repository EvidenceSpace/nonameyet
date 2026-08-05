import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("wires ephemeral PDF OCR progress to the active browser run", () => {
  assert.match(ui, /createPdfOcrProgressTracker/);
  assert.match(ui, /controllers\.has\(file\.id\)/);
  assert.match(ui, /onOcrProgress\(progress\)/);
  assert.match(ui, /pdfOcrProgress\.update\(file\.id, controller, progress\)/);
  assert.match(ui, /pdfOcrProgress\.finish\(file\.id, controller\)/);
  assert.match(ui, /await refreshLatest\(\)/);
  assert.match(ui, /cancelButton\.onclick = \(\) => controllers\.get\(file\.id\)\?\.abort\(\)/);
});

test("uses truthful PDF processing and empty-page copy", () => {
  assert.match(ui, /Reading this PDF locally and checking pages that may need OCR/);
  assert.match(ui, /No readable text was extracted from this page\./);
  assert.doesNotMatch(ui, /Reading selectable text locally/);
  assert.doesNotMatch(ui, /No selectable text on this page\./);
});

test("emits a safe OCR-start event before page results", () => {
  assert.match(pdf, /status: "starting"/);
  assert.match(pdf, /completedPages: 0/);
  assert.match(pdf, /reportOcrProgress\(onOcrProgress/);
});
