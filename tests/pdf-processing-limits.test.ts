import assert from "node:assert/strict";
import test from "node:test";
import { processPdf } from "../web/pdf-processing.js";
import { PDF_FILE_TOO_LARGE_MESSAGE, PDF_TEXT_LIMIT_MESSAGE, PDF_TIMEOUT_MESSAGE } from "../web/pdf-failure-recovery.js";

function pdfBytes(size = 8) {
  const bytes = new Uint8Array(Math.max(size, 8));
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  return bytes.buffer;
}

function source(arrayBuffer: () => Promise<ArrayBuffer>, size?: number) {
  return { id: "pdf-1", caseId: "case-1", sha256: "a".repeat(64), original: { arrayBuffer, size } };
}

function documentWithText(text: string, counters = { pageCleanups: 0, documentDestroys: 0 }) {
  return {
    counters,
    document: {
      numPages: 1,
      async getPage() {
        return {
          async getTextContent() { return { items: [{ str: text }] }; },
          cleanup() { counters.pageCleanups += 1; },
        };
      },
      async destroy() { counters.documentDestroys += 1; },
    },
  };
}

test("rejects a declared oversized PDF before reading bytes or starting PDF.js", async () => {
  let reads = 0;
  let starts = 0;
  const file = source(async () => { reads += 1; return new ArrayBuffer(1); }, 101);
  const result = await processPdf(file, { maxBytes: 100, runtime: { getDocument() { starts += 1; throw new Error("must not start"); } } });
  assert.equal(result.message, PDF_FILE_TOO_LARGE_MESSAGE);
  assert.deepEqual(result.failure, { code: "file_too_large", retryable: false });
  assert.equal(reads, 0);
  assert.equal(starts, 0);
  assert.equal(result.artifact, undefined);
});

test("rejects oversized stored bytes before starting PDF.js", async () => {
  let starts = 0;
  const result = await processPdf(source(async () => new ArrayBuffer(101)), {
    maxBytes: 100,
    runtime: { getDocument() { starts += 1; throw new Error("must not start"); } },
  });
  assert.equal(result.message, PDF_FILE_TOO_LARGE_MESSAGE);
  assert.equal(starts, 0);
});

test("stops at the selectable-text cap and cleans resources", async () => {
  const fixture = documentWithText("12345678901");
  const result = await processPdf(source(async () => pdfBytes()), {
    maxTextCharacters: 10,
    runtime: { version: "test", getDocument: () => ({ promise: Promise.resolve(fixture.document) }) },
  });
  assert.equal(result.message, PDF_TEXT_LIMIT_MESSAGE);
  assert.deepEqual(result.failure, { code: "text_limit_exceeded", retryable: false });
  assert.equal(result.artifact, undefined);
  assert.deepEqual(fixture.counters, { pageCleanups: 1, documentDestroys: 1 });
});

test("times out stalled PDF.js work, destroys the task, and remains retryable", async () => {
  let taskDestroys = 0;
  const result = await processPdf(source(async () => pdfBytes()), {
    timeoutMs: 5,
    runtime: { getDocument: () => ({ promise: new Promise(() => {}), destroy() { taskDestroys += 1; } }) },
  });
  assert.equal(result.message, PDF_TIMEOUT_MESSAGE);
  assert.deepEqual(result.failure, { code: "processing_timeout", retryable: true });
  assert.equal(result.artifact, undefined);
  assert.equal(taskDestroys, 1);
});

test("keeps normal extraction below all limits", async () => {
  const fixture = documentWithText("Invoice total 5,000 remains unpaid.");
  const result = await processPdf(source(async () => pdfBytes()), {
    maxBytes: 8,
    maxTextCharacters: 100,
    timeoutMs: 100,
    runtime: { version: "test", getDocument: () => ({ promise: Promise.resolve(fixture.document) }) },
  });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.text, "Invoice total 5,000 remains unpaid.");
});
