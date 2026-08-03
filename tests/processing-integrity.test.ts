import assert from "node:assert/strict";
import test from "node:test";
import { inspectProcessingJob, INVALID_EXTRACTION_MESSAGE, STALE_EXTRACTION_MESSAGE } from "../web/processing-integrity.js";

const file = { id: "file-1", caseId: "case-1", sha256: "a".repeat(64) };
const artifact = {
  adapterId: "local-image-ocr",
  adapterVersion: "1.0.0+test-1",
  text: "Invoice 1042\n\nBalance due 5,000",
  pages: [
    { pageNumber: 1, text: "Invoice 1042", start: 0, end: 12 },
    { pageNumber: 2, text: "Balance due 5,000", start: 14, end: 31 },
  ],
  warnings: ["Compare extracted text with the original."],
};
const ready = { fileId: file.id, caseId: file.caseId, fileHash: file.sha256, status: "ready_for_ai", message: "Text ready", artifact };

test("accepts a fully valid ready artifact", () => {
  assert.deepEqual(inspectProcessingJob(file, ready), { status: "ready_for_ai", message: "Text ready" });
});

test("fails closed when processing provenance does not match the original", () => {
  assert.deepEqual(inspectProcessingJob(file, { ...ready, fileHash: "b".repeat(64) }), { status: "failed", message: STALE_EXTRACTION_MESSAGE });
  assert.deepEqual(inspectProcessingJob(file, { ...ready, caseId: "case-2" }), { status: "failed", message: STALE_EXTRACTION_MESSAGE });
  assert.deepEqual(inspectProcessingJob(file, { ...ready, fileId: "file-2" }), { status: "failed", message: STALE_EXTRACTION_MESSAGE });
});

test("rejects artifact-wide inconsistencies even when page text alone is valid", () => {
  const variants = [
    { ...artifact, text: "Different combined text" },
    { ...artifact, warnings: [""] },
    { ...artifact, pages: artifact.pages.map((page, index) => index ? { ...page, start: 13 } : page) },
    { ...artifact, adapterVersion: "" },
  ];
  for (const invalid of variants) {
    assert.deepEqual(inspectProcessingJob(file, { ...ready, artifact: invalid }), { status: "failed", message: INVALID_EXTRACTION_MESSAGE });
  }
});

test("preserves non-ready processing states without trusting their artifacts", () => {
  assert.deepEqual(inspectProcessingJob(file, undefined), { status: "unprocessed", message: "" });
  assert.deepEqual(inspectProcessingJob(file, { ...ready, status: "extracting", message: "Reading locally", artifact: undefined }), { status: "extracting", message: "Reading locally" });
});
