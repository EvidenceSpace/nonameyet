import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const progress = readFileSync(new URL("../web/pdf-ocr-progress.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../web/processing.css", import.meta.url), "utf8");

test("renders active local PDF OCR as an accessible native progress meter", () => {
  assert.match(ui, /buildPdfOcrProgressView/);
  assert.match(ui, /document\.createElement\("progress"\)/);
  assert.match(ui, /aria-label", "Local PDF OCR progress"/);
  assert.match(ui, /aria-valuetext", view\.ariaValueText/);
  assert.match(ui, /bar\.max = view\.max/);
  assert.match(ui, /bar\.value = view\.value/);
  assert.match(ui, /label\.textContent !== view\.label/);
});

test("keeps the meter ephemeral and scoped to the active run", () => {
  assert.match(ui, /pdfOcrProgress\.progress\(file\.id\)/);
  assert.match(ui, /setPdfOcrMeter\(row, livePdfProgressValue\)/);
  assert.match(ui, /pdfOcrProgress\.finish\(file\.id, controller\)/);
  assert.match(ui, /if \(!view\) \{\s*meter\?\.remove\(\)/);
  assert.match(progress, /return progress \? \{ \.\.\.progress \} : null/);
  assert.match(progress, /followsAcceptedProgress/);
});

test("styles the determinate meter for desktop and narrow layouts", () => {
  assert.match(css, /\.pdf-ocr-meter\{/);
  assert.match(css, /progress::-webkit-progress-value/);
  assert.match(css, /progress::-moz-progress-bar/);
  assert.match(css, /font-variant-numeric:tabular-nums/);
  assert.match(css, /\.processing-note,\.pdf-ocr-meter\{grid-column:2\}/);
});
