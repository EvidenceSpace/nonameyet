import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const processor = readFileSync(new URL("../web/image-ocr.js", import.meta.url), "utf8");
const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");

test("routes image failures through safe classification and attention UI", () => {
  assert.match(processor, /classifyImageOcrFailure/);
  assert.match(processor, /message:\s*failure\.message/);
  assert.match(ui, /imageFailureNeedsAttention/);
  assert.match(ui, /pdfFailureNeedsAttention \|\| imageFailureNeedsAttention/);
});
