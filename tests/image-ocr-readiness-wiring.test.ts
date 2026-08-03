import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");

test("preflights the exact runtime passed to image processing", () => {
  assert.match(ui, /const imageOcrRuntime = browserTextDetectorRuntime\(\)/);
  assert.match(ui, /processImage\(file, \{ signal: controller\.signal, runtime: imageOcrRuntime \}\)/);
});

test("does not offer a doomed OCR action when readiness is unavailable", () => {
  assert.match(ui, /canStartImageOcr/);
  assert.match(ui, /OCR unavailable/);
  assert.match(ui, /ocr-readiness-notice/);
});
