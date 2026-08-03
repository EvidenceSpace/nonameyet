import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const processor = readFileSync(new URL("../web/image-ocr.js", import.meta.url), "utf8");
const failures = readFileSync(new URL("../web/image-ocr-failure-recovery.js", import.meta.url), "utf8");
const readiness = readFileSync(new URL("../web/image-ocr-readiness.js", import.meta.url), "utf8");

test("wires image OCR output limits through recovery and retry policy", () => {
  for (const name of ["MAX_IMAGE_OCR_CHARACTERS", "MAX_IMAGE_OCR_BLOCKS", "MAX_IMAGE_OCR_WARNINGS", "MAX_IMAGE_OCR_WARNING_LENGTH"]) assert.match(processor, new RegExp(name));
  assert.match(failures, /output_too_large/); assert.match(failures, /invalid_output/);
  assert.match(readiness, /"output_too_large"/);
});
