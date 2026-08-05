import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "" },
});

const recoveryModule = import("../web/processing-orphan-recovery.js");
async function recoverOrphanedProcessingRuns(...args: any[]) {
  const recovery = await recoveryModule;
  return recovery.recoverOrphanedProcessingRuns(...args);
}

function extracting(fileId: string, overrides: Record<string, unknown> = {}) {
  return {
    fileId,
    caseId: "case-1",
    fileHash: `${fileId}-hash`,
    status: "extracting",
    message: "private partial state",
    updatedAt: "2026-08-05T18:00:00.000Z",
    artifact: { text: "partial text" },
    nextRetryAt: "2026-08-05T18:01:00.000Z",
    ...overrides,
  };
}

test("recovers only exact orphaned runs while preserving active and unconfirmed work", async () => {
  const jobs = [
    { ...extracting("ready"), status: "ready_for_ai" },
    extracting("orphan"),
    extracting("active"),
    extracting("unsupported"),
    extracting("raced"),
    extracting("invalid", { fileHash: "" }),
  ];
  const replacements: Array<{ expected: any; replacement: any }> = [];
  const outcome = await recoverOrphanedProcessingRuns("case-1", {
    getProcessingForCaseImpl: async () => jobs,
    saveProcessingIfCurrentImpl: async (expected: any, replacement: any) => {
      replacements.push({ expected, replacement });
      return expected.fileId !== "raced";
    },
    withProcessingLeaseImpl: async (
      fileId: string,
      task: () => Promise<boolean>,
    ) => {
      if (fileId === "active") return { acquired: false, reason: "busy" };
      if (fileId === "unsupported")
        return { acquired: false, reason: "unsupported" };
      return { acquired: true, value: await task() };
    },
    now: () => "2026-08-05T18:02:00.000Z",
  });

  assert.deepEqual(outcome, {
    recovered: ["orphan"],
    active: ["active"],
    unconfirmed: ["unsupported"],
    invalid: 1,
  });
  assert.deepEqual(
    replacements.map(({ expected }) => expected.fileId),
    ["orphan", "raced"],
  );
  for (const { expected, replacement } of replacements) {
    assert.equal(replacement.fileId, expected.fileId);
    assert.equal(replacement.caseId, expected.caseId);
    assert.equal(replacement.fileHash, expected.fileHash);
    assert.equal(replacement.status, "failed");
    assert.deepEqual(replacement.failure, {
      code: "transient_error",
      retryable: true,
    });
    assert.equal("artifact" in replacement, false);
    assert.equal("nextRetryAt" in replacement, false);
    assert.equal(
      JSON.stringify(replacement).includes("private partial state"),
      false,
    );
  }
});

test("rejects invalid recovery inputs without changing storage", async () => {
  let read = false;
  await assert.rejects(
    () =>
      recoverOrphanedProcessingRuns("", {
        getProcessingForCaseImpl: async () => {
          read = true;
          return [];
        },
      }),
    /case identity is invalid/,
  );
  assert.equal(read, false);
  await assert.rejects(
    () =>
      recoverOrphanedProcessingRuns("case-1", {
        getProcessingForCaseImpl: async () => null,
      }),
    /jobs are invalid/,
  );
});

test("propagates exact-current replacement failures to startup recovery", async () => {
  await assert.rejects(
    () =>
      recoverOrphanedProcessingRuns("case-1", {
        getProcessingForCaseImpl: async () => [extracting("orphan")],
        withProcessingLeaseImpl: async (
          _fileId: string,
          task: () => Promise<boolean>,
        ) => ({
          acquired: true,
          value: await task(),
        }),
        saveProcessingIfCurrentImpl: async () => {
          throw new Error("storage failed");
        },
      }),
    /storage failed/,
  );
});
