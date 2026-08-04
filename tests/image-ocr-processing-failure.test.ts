import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { processImage } from "../web/image-ocr.js";
import { IMAGE_CORRUPT_MESSAGE, IMAGE_TRANSIENT_MESSAGE } from "../web/image-ocr-failure-recovery.js";

const png = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1]);
function file(bytes = png, type = "image/png") {
  return { id: "img", caseId: "case", sha256: createHash("sha256").update(bytes).digest("hex"), type, size: bytes.length, original: { arrayBuffer: async () => bytes.buffer } };
}

test("mismatched bytes fail permanently before OCR starts", async () => {
  let starts = 0;
  const result = await processImage(file(png, "image/jpeg"), { runtime: { recognize() { starts += 1; throw new Error("must not start"); } } });
  assert.equal(result.message, IMAGE_CORRUPT_MESSAGE);
  assert.deepEqual(result.failure, { code: "corrupt_file", retryable: false });
  assert.equal(result.artifact, undefined);
  assert.equal(starts, 0);
});

test("unknown runtime errors are sanitized and remain retryable", async () => {
  const result = await processImage(file(), { runtime: { id: "test", version: "1", recognize() { throw new Error("private decoder pointer 0xbeef"); } } });
  assert.equal(result.message, IMAGE_TRANSIENT_MESSAGE);
  assert.deepEqual(result.failure, { code: "transient_error", retryable: true });
  assert.equal(result.message.includes("0xbeef"), false);
});
