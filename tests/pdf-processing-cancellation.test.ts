import assert from "node:assert/strict";
import test from "node:test";
import { PDF_CANCELLED_MESSAGE, processPdf } from "../web/pdf-processing.js";

function pdfBytes(size = 8) {
  const bytes = new Uint8Array(Math.max(size, 8));
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
  return bytes.buffer;
}

function file(arrayBuffer = async () => pdfBytes()) {
  return { id: "pdf-1", caseId: "case-1", sha256: "a".repeat(64), original: { arrayBuffer } };
}

test("a pre-aborted request never reads the original or starts PDF.js", async () => {
  const controller = new AbortController();
  controller.abort();
  let reads = 0;
  let starts = 0;
  const result = await processPdf(file(async () => { reads += 1; return new ArrayBuffer(8); }), {
    signal: controller.signal,
    runtime: { getDocument() { starts += 1; throw new Error("must not start"); } },
  });
  assert.equal(result.status, "cancelled");
  assert.equal(result.message, PDF_CANCELLED_MESSAGE);
  assert.equal(reads, 0);
  assert.equal(starts, 0);
  assert.equal(result.artifact, undefined);
});

test("cancellation destroys an in-flight PDF.js loading task", async () => {
  const controller = new AbortController();
  let destroyed = 0;
  let started;
  const loading = new Promise(() => {});
  const resultPromise = processPdf(file(), {
    signal: controller.signal,
    runtime: {
      getDocument() {
        started?.();
        return { promise: loading, destroy() { destroyed += 1; } };
      },
    },
  });
  await new Promise((resolve) => { started = resolve; setTimeout(resolve, 0); });
  controller.abort();
  const result = await resultPromise;
  assert.equal(result.status, "cancelled");
  assert.deepEqual(result.failure, { code: "cancelled", retryable: false });
  assert.equal(result.artifact, undefined);
  assert.equal(destroyed, 1);
});

test("cancellation during page extraction cleans up page and document resources", async () => {
  const controller = new AbortController();
  let releaseStarted;
  const started = new Promise((resolve) => { releaseStarted = resolve; });
  let pageCleanups = 0;
  let documentDestroys = 0;
  let taskDestroys = 0;
  const doc = {
    numPages: 1,
    async getPage() {
      return {
        getTextContent() { releaseStarted(); return new Promise(() => {}); },
        cleanup() { pageCleanups += 1; },
      };
    },
    async destroy() { documentDestroys += 1; },
  };
  const resultPromise = processPdf(file(), {
    signal: controller.signal,
    runtime: { version: "test", getDocument: () => ({ promise: Promise.resolve(doc), destroy() { taskDestroys += 1; } }) },
  });
  await started;
  controller.abort();
  const result = await resultPromise;
  assert.equal(result.status, "cancelled");
  assert.equal(result.artifact, undefined);
  assert.equal(pageCleanups, 1);
  assert.equal(documentDestroys, 1);
  assert.equal(taskDestroys, 1);
});

test("successful extraction still releases resources and preserves provenance", async () => {
  let pageCleanups = 0;
  let documentDestroys = 0;
  const doc = {
    numPages: 1,
    async getPage() {
      return {
        async getTextContent() { return { items: [{ str: "Invoice total 5,000 remains unpaid." }] }; },
        cleanup() { pageCleanups += 1; },
      };
    },
    async destroy() { documentDestroys += 1; },
  };
  const result = await processPdf(file(), {
    runtime: { version: "4.10.38-test", getDocument: () => ({ promise: Promise.resolve(doc) }) },
  });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.fileHash, undefined);
  assert.equal(result.fileHash, "a".repeat(64));
  assert.equal(result.artifact?.text, "Invoice total 5,000 remains unpaid.");
  assert.equal(result.artifact?.adapterVersion, "1.0.0+pdfjs-4.10.38-test");
  assert.equal(pageCleanups, 1);
  assert.equal(documentDestroys, 1);
});
