import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUnexpectedProcessingFailure,
  PROCESSING_RUN_FAILED_MESSAGE,
  PROCESSING_STORAGE_UNAVAILABLE_MESSAGE,
} from "../web/processing-run-recovery.js";

const marker = {
  fileId: "file-recovery",
  caseId: "case-recovery",
  fileHash: "a".repeat(64),
  status: "extracting",
  message: "private decoder pointer 0xbeef",
  updatedAt: "2026-08-05T16:00:00.000Z",
  nextRetryAt: "2026-08-05T16:01:00.000Z",
  artifact: { text: "partial text that must not survive" },
};

test("unexpected run failures keep only exact ownership and safe retry metadata", () => {
  const recoveredAt = "2026-08-05T16:02:00.000Z";
  const failure = buildUnexpectedProcessingFailure(marker, recoveredAt);
  assert.deepEqual(failure, {
    fileId: marker.fileId,
    caseId: marker.caseId,
    fileHash: marker.fileHash,
    status: "failed",
    message: PROCESSING_RUN_FAILED_MESSAGE,
    updatedAt: recoveredAt,
    failure: { code: "transient_error", retryable: true },
  });
  assert.equal("artifact" in failure, false);
  assert.equal("nextRetryAt" in failure, false);
  assert.equal(JSON.stringify(failure).includes("0xbeef"), false);
});

test("recovery rejects incomplete ownership and invalid timestamps", () => {
  assert.throws(() => buildUnexpectedProcessingFailure({ ...marker, fileHash: "" }), /identity is invalid/);
  assert.throws(() => buildUnexpectedProcessingFailure(marker, "not-a-time"), /time is invalid/);
});

test("storage failure guidance remains local and preserves the original", () => {
  assert.match(PROCESSING_STORAGE_UNAVAILABLE_MESSAGE, /original remains stored locally/i);
  assert.match(PROCESSING_STORAGE_UNAVAILABLE_MESSAGE, /reload this case/i);
});
