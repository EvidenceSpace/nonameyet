import assert from "node:assert/strict";
import test from "node:test";
import { hasPdfHeader, PDF_HEADER_SCAN_BYTES, processPdf } from "../web/pdf-processing.js";
import { PDF_INVALID_SIGNATURE_MESSAGE } from "../web/pdf-failure-recovery.js";

function source(bytes: Uint8Array) {
  return { id: "pdf-1", caseId: "case-1", sha256: "a".repeat(64), original: { arrayBuffer: async () => bytes.buffer } };
}

function bytesWithHeader(offset: number, length = offset + 8) {
  const bytes = new Uint8Array(length);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d], offset);
  return bytes;
}

test("recognizes a PDF header only inside the bounded prefix", () => {
  assert.equal(hasPdfHeader(bytesWithHeader(0)), true);
  assert.equal(hasPdfHeader(bytesWithHeader(PDF_HEADER_SCAN_BYTES - 5, PDF_HEADER_SCAN_BYTES)), true);
  assert.equal(hasPdfHeader(bytesWithHeader(PDF_HEADER_SCAN_BYTES, PDF_HEADER_SCAN_BYTES + 8)), false);
});

test("rejects empty and mislabeled bytes before starting PDF.js", async () => {
  for (const bytes of [new Uint8Array(), new TextEncoder().encode("plain text renamed to .pdf")]) {
    let starts = 0;
    const result = await processPdf(source(bytes), { runtime: { getDocument() { starts += 1; throw new Error("must not start"); } } });
    assert.equal(result.message, PDF_INVALID_SIGNATURE_MESSAGE);
    assert.deepEqual(result.failure, { code: "invalid_pdf_signature", retryable: false });
    assert.equal(result.artifact, undefined);
    assert.equal(starts, 0);
  }
});

test("allows a bounded-header PDF to reach the local parser", async () => {
  let starts = 0;
  const result = await processPdf(source(bytesWithHeader(512, 520)), {
    runtime: {
      getDocument() {
        starts += 1;
        const error = new Error("damaged body");
        error.name = "InvalidPDFException";
        return { promise: Promise.reject(error) };
      },
    },
  });
  assert.equal(starts, 1);
  assert.deepEqual(result.failure, { code: "corrupt_file", retryable: false });
});
