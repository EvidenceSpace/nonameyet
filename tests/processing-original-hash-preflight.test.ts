import assert from "node:assert/strict";
import test from "node:test";
import { processImage } from "../web/image-ocr.js";
import { processPdf } from "../web/pdf-processing.js";

const wrongHash = "0".repeat(64);
const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3,4]);
const pdf = new TextEncoder().encode("%PDF-1.7\nchanged local bytes");

test("image hash mismatch blocks OCR runtime and artifact creation", async () => {
  let called = false;
  const file = { id: "image-1", caseId: "case-1", sha256: wrongHash, type: "image/png", size: png.length, original: { async arrayBuffer() { return png.buffer; } } };
  const runtime = { id: "test", version: "1", async recognize() { called = true; return { text: "unsafe", width: 1, height: 1 }; } };
  const result = await processImage(file, { runtime });
  assert.equal(called, false);
  assert.deepEqual(result.failure, { code: "original_hash_mismatch", retryable: false });
  assert.equal(result.artifact, undefined);
});

test("PDF hash mismatch blocks PDF.js and artifact creation", async () => {
  let called = false;
  const file = { id: "pdf-1", caseId: "case-1", sha256: wrongHash, type: "application/pdf", size: pdf.length, original: { size: pdf.length, async arrayBuffer() { return pdf.buffer; } } };
  const runtime = { version: "test", getDocument() { called = true; throw new Error("must not start"); } };
  const result = await processPdf(file, { runtime, timeoutMs: 1_000 });
  assert.equal(called, false);
  assert.deepEqual(result.failure, { code: "original_hash_mismatch", retryable: false });
  assert.equal(result.artifact, undefined);
});

test("unavailable hashing remains retryable and never starts parsers", async () => {
  let imageCalled = false;
  const imageFile = { id: "image-1", caseId: "case-1", sha256: wrongHash, type: "image/png", size: png.length, original: { async arrayBuffer() { return png.buffer; } } };
  const image = await processImage(imageFile, { cryptoImpl: {} as Crypto, runtime: { id: "test", version: "1", async recognize() { imageCalled = true; } } });
  assert.equal(imageCalled, false);
  assert.deepEqual(image.failure, { code: "hash_unavailable", retryable: true });
});
