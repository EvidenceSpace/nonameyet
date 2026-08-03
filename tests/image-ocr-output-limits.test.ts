import assert from "node:assert/strict";
import test from "node:test";
import { browserTextDetectorRuntime, MAX_IMAGE_OCR_BLOCKS, MAX_IMAGE_OCR_CHARACTERS, MAX_IMAGE_OCR_WARNINGS, MAX_IMAGE_OCR_WARNING_LENGTH, processImage } from "../web/image-ocr.js";

const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]);
const file = { id: "file-1", caseId: "case-1", sha256: "a".repeat(64), type: "image/png", size: png.length, original: { async arrayBuffer() { return png.buffer; } } };
const runtime = (result: unknown) => ({ id: "test", version: "1", async recognize() { return result; } });

test("fails permanently before persisting oversized OCR text", async () => {
  const result = await processImage(file, { runtime: runtime({ text: "x".repeat(MAX_IMAGE_OCR_CHARACTERS + 1), width: 100, height: 100 }) });
  assert.equal(result.status, "failed"); assert.deepEqual(result.failure, { code: "output_too_large", retryable: false }); assert.equal(result.artifact, undefined);
});

test("bounds OCR warning count and length before persistence", async () => {
  for (const warnings of [Array(MAX_IMAGE_OCR_WARNINGS + 1).fill("warning"), ["x".repeat(MAX_IMAGE_OCR_WARNING_LENGTH + 1)]]) {
    const result = await processImage(file, { runtime: runtime({ text: "Invoice 1042", width: 100, height: 100, warnings }) });
    assert.deepEqual(result.failure, { code: "output_too_large", retryable: false }); assert.equal(result.artifact, undefined);
  }
});

test("sanitizes malformed adapter output without storing an artifact", async () => {
  for (const output of [null, { text: 42, width: 100, height: 100 }, { text: "Invoice", width: 100, height: 100, warnings: "unsafe" }]) {
    const result = await processImage(file, { runtime: runtime(output) });
    assert.deepEqual(result.failure, { code: "invalid_output", retryable: true }); assert.equal(result.artifact, undefined);
  }
});

test("TextDetector runtime rejects excessive blocks before joining text and closes the bitmap", async () => {
  let closed = false;
  const blocks = Array.from({ length: MAX_IMAGE_OCR_BLOCKS + 1 }, (_, index) => ({ rawValue: "x", boundingBox: { x: 0, y: index } }));
  const detector = browserTextDetectorRuntime({ TextDetector: class { async detect() { return blocks; } }, async createImageBitmap() { return { width: 100, height: 100, close() { closed = true; } }; } });
  await assert.rejects(() => detector!.recognize({ bytes: png, mimeType: "image/png" }), (error: any) => error.code === "output_too_large");
  assert.equal(closed, true);
});
