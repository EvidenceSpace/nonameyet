import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const image = readFileSync(new URL("../web/image-ocr.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");
const imageFailures = readFileSync(new URL("../web/image-ocr-failure-recovery.js", import.meta.url), "utf8");
const pdfFailures = readFileSync(new URL("../web/pdf-failure-recovery.js", import.meta.url), "utf8");

test("verifies original bytes before starting OCR or PDF parsing", () => {
  assert.ok(image.indexOf("assertOriginalBytesMatchHash") < image.indexOf("runtime.recognize"));
  assert.ok(pdf.indexOf("assertOriginalBytesMatchHash") < pdf.indexOf("getDocument"));
  for (const source of [imageFailures, pdfFailures]) {
    assert.match(source, /original_hash_mismatch/);
    assert.match(source, /hash_unavailable/);
  }
});
