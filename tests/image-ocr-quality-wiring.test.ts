import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const processor = readFileSync(new URL("../web/image-ocr.js", import.meta.url), "utf8");
const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");

test("persists OCR quality and renders it beside provenance", () => {
  assert.match(processor, /buildImageOcrQuality/);
  assert.match(processor, /quality/);
  assert.match(ui, /text-source-quality/);
  assert.match(ui, /formatImageOcrQuality/);
});
