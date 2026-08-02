import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";
import { backupLimits, createEncryptedCaseBackup, materializeCaseBackup, recoverInterruptedProcessing } from "../web/case-backup.js";

const bytes = new TextEncoder().encode("original image bytes");
const hash = Buffer.from(await webcrypto.subtle.digest("SHA-256", bytes)).toString("hex");
const caseId = "case_processing_restore";
const file = {
  id: "file_processing_restore",
  caseId,
  name: "proof.png",
  type: "image/png",
  size: bytes.length,
  sha256: hash,
  bytes: Buffer.from(bytes).toString("base64"),
};
const artifact = {
  adapterId: "local-image-ocr",
  adapterVersion: "1.0.0+restore-test-1",
  text: "Invoice 1042\n\nBalance due 5,000",
  pages: [
    { pageNumber: 1, text: "Invoice 1042", start: 0, end: 12 },
    { pageNumber: 2, text: "Balance due 5,000", start: 14, end: 31 },
  ],
  warnings: ["Compare the extracted text with the original."],
};
const processing = {
  fileId: file.id,
  caseId,
  fileHash: hash,
  status: "ready_for_ai",
  message: "Local OCR text is ready for review.",
  artifact,
};
function payload() {
  return {
    format: backupLimits.format,
    case: { id: caseId, title: "Processing restore" },
    files: [{ ...file }],
    facts: [],
    suggestions: [],
    processing: [{ ...processing, artifact: { ...artifact, pages: artifact.pages.map((page) => ({ ...page })), warnings: [...artifact.warnings] } }],
    events: [],
  };
}

test("restore accepts a provenance-consistent processing artifact", async () => {
  const bundle = await materializeCaseBackup(payload(), { cryptoRef: webcrypto as any });
  assert.equal(bundle.processing[0].artifact.text, artifact.text);
  assert.equal(bundle.processing[0].fileHash, hash);
});

test("restore rejects mismatched hashes, text ranges, and warning metadata", async () => {
  const mismatchedHash = payload();
  mismatchedHash.processing[0].fileHash = "a".repeat(64);
  await assert.rejects(() => materializeCaseBackup(mismatchedHash, { cryptoRef: webcrypto as any }), /invalid extraction data/);

  const badRange = payload();
  badRange.processing[0].artifact.pages[1].start = 13;
  await assert.rejects(() => materializeCaseBackup(badRange, { cryptoRef: webcrypto as any }), /invalid extraction data/);

  const badWarnings = payload();
  badWarnings.processing[0].artifact.warnings = [""];
  await assert.rejects(() => materializeCaseBackup(badWarnings, { cryptoRef: webcrypto as any }), /invalid extraction data/);
});

test("backup creation refuses malformed local extraction state", async () => {
  const localFile = { ...file, original: new Blob([bytes]) };
  delete (localFile as { bytes?: string }).bytes;
  const invalid = { ...processing, artifact: { ...artifact, adapterVersion: "" } };
  await assert.rejects(() => createEncryptedCaseBackup({ record: { id: caseId }, files: [localFile], facts: [], suggestions: [], processing: [invalid], events: [] }, "correct horse battery", { cryptoRef: webcrypto as any }), /Stored extraction data is invalid/);
});

test("restore converts worker-dependent processing states into retryable failures", async () => {
  const restoredAt = "2026-08-03T00:00:00.000Z";
  const interrupted = ["queued", "extracting", "retry_wait"].map((status) => ({
    fileId: file.id,
    caseId,
    fileHash: hash,
    status,
    message: "Old transient state",
    nextRetryAt: "2026-08-02T23:00:00.000Z",
    failure: { code: "transient_error", retryable: true },
  }));
  const recovered = recoverInterruptedProcessing(interrupted, restoredAt);
  for (const job of recovered) {
    assert.equal(job.status, "failed");
    assert.equal(job.message, "Processing was interrupted before this backup was restored. Process the source again.");
    assert.deepEqual(job.failure, { code: "interrupted", retryable: true });
    assert.equal(job.updatedAt, restoredAt);
    assert.equal(job.fileHash, hash);
    assert.equal("nextRetryAt" in job, false);
    assert.equal("artifact" in job, false);
  }

  const interruptedPayload = payload() as any;
  interruptedPayload.processing[0] = { fileId: file.id, caseId, fileHash: hash, status: "extracting", message: "Running OCR locally…" };
  const bundle = await materializeCaseBackup(interruptedPayload, { cryptoRef: webcrypto as any, now: () => new Date(restoredAt) });
  assert.equal(bundle.processing[0].status, "failed");
  assert.equal(bundle.processing[0].failure.code, "interrupted");
});

test("restore preserves completed processing state", () => {
  const completed = [processing];
  assert.deepEqual(recoverInterruptedProcessing(completed, "2026-08-03T00:00:00.000Z"), completed);
});
