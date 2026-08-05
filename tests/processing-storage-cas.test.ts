import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "" },
});

const storageModule = import("../web/storage.js");
async function saveProcessingIfCurrent(...args: any[]) {
  const storage = await storageModule;
  return storage.saveProcessingIfCurrent(...args);
}

function processingJob(overrides: Record<string, unknown> = {}) {
  return {
    fileId: "file-1",
    caseId: "case-1",
    fileHash: "hash-1",
    status: "ready_for_ai",
    message: "Text ready.",
    updatedAt: "2026-08-05T12:00:00.000Z",
    artifact: {
      adapterId: "pdfjs-text",
      adapterVersion: "1.0.0+pdfjs-4.10.38",
      pages: [{ pageNumber: 1, text: "Existing text" }, { pageNumber: 2, text: "" }],
      text: "Existing text",
      warnings: ["Page 2 needs OCR."],
    },
    failure: { code: "ocr_timeout", retryable: true },
    ...overrides,
  };
}

function fakeDatabase(
  initialProcessing: unknown,
  initialCase: unknown = { id: "case-1", updatedAt: "old" },
  { failProcessingPut = false } = {},
) {
  let processingValue = structuredClone(initialProcessing);
  let caseValue = structuredClone(initialCase);
  let closed = false;
  const transactions: Array<{ stores: string[]; mode: string }> = [];
  const writes: string[] = [];

  const db = {
    transaction(storeNames: string[], mode: string) {
      transactions.push({ stores: [...storeNames], mode });
      let stagedProcessing = structuredClone(processingValue);
      let stagedCase = structuredClone(caseValue);
      const stagedWrites: string[] = [];
      let pending = 0;
      let completed = false;
      const tx: any = {
        error: null,
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore(name: string) {
          if (name === "processing") {
            return {
              get() { return request(() => structuredClone(stagedProcessing)); },
              put(value: unknown) {
                return request(() => {
                  if (failProcessingPut) throw new Error("Processing write failed");
                  stagedProcessing = structuredClone(value);
                  stagedWrites.push("processing");
                  return (value as { fileId?: string })?.fileId;
                });
              },
            };
          }
          if (name === "cases") {
            return {
              get() { return request(() => structuredClone(stagedCase)); },
              put(value: unknown) {
                return request(() => {
                  stagedCase = structuredClone(value);
                  stagedWrites.push("cases");
                  return (value as { id?: string })?.id;
                });
              },
            };
          }
          throw new Error(`Unexpected store ${name}`);
        },
      };

      function finishIfIdle() {
        if (pending || completed) return;
        completed = true;
        processingValue = stagedProcessing;
        caseValue = stagedCase;
        writes.push(...stagedWrites);
        tx.oncomplete?.();
      }

      function request(operation: () => unknown) {
        pending += 1;
        const result: any = { result: undefined, error: null, onsuccess: null };
        queueMicrotask(() => {
          try {
            result.result = operation();
            result.onsuccess?.();
            pending -= 1;
            queueMicrotask(finishIfIdle);
          } catch (error) {
            result.error = error;
            tx.error = error;
            completed = true;
            tx.onerror?.();
            tx.onabort?.();
          }
        });
        return result;
      }

      return tx;
    },
    close() { closed = true; },
  };

  return {
    db,
    processing: () => processingValue,
    caseRecord: () => caseValue,
    transactions,
    writes,
    closed: () => closed,
  };
}

test("atomically replaces the processing job only when the stored snapshot is current", async () => {
  const expected = processingJob();
  const replacement = processingJob({
    updatedAt: "2026-08-05T12:01:00.000Z",
    failure: undefined,
    artifact: {
      ...(expected.artifact as object),
      adapterId: "pdfjs-text+local-pdf-ocr",
      pages: [{ pageNumber: 1, text: "Existing text" }, { pageNumber: 2, text: "Recovered text" }],
      text: "Existing text\n\nRecovered text",
      warnings: [],
    },
  });
  const fake = fakeDatabase(expected);
  const replaced = await saveProcessingIfCurrent(expected, replacement, {
    openDatabaseImpl: async () => fake.db,
    now: () => "2026-08-05T12:01:01.000Z",
  });

  assert.equal(replaced, true);
  assert.deepEqual(fake.processing(), replacement);
  assert.equal((fake.caseRecord() as { updatedAt: string }).updatedAt, "2026-08-05T12:01:01.000Z");
  assert.deepEqual(fake.transactions, [{ stores: ["processing", "cases"], mode: "readwrite" }]);
  assert.deepEqual(fake.writes, ["processing", "cases"]);
  assert.equal(fake.closed(), true);
});

test("keeps a newer or missing processing job without touching case activity", async () => {
  const expected = processingJob();
  const replacement = processingJob({ updatedAt: "2026-08-05T12:01:00.000Z" });
  const newer = processingJob({
    updatedAt: "2026-08-05T12:00:30.000Z",
    artifact: { ...(expected.artifact as object), text: "Newer text", pages: [{ pageNumber: 1, text: "Newer text" }] },
  });

  for (const current of [undefined, newer]) {
    const fake = fakeDatabase(current);
    const replaced = await saveProcessingIfCurrent(expected, replacement, {
      openDatabaseImpl: async () => fake.db,
      now: () => "should-not-be-used",
    });
    assert.equal(replaced, false);
    assert.deepEqual(fake.processing(), current);
    assert.deepEqual(fake.caseRecord(), { id: "case-1", updatedAt: "old" });
    assert.deepEqual(fake.writes, []);
    assert.equal(fake.closed(), true);
  }
});

test("fails closed when stored processing data cannot be compared safely", async () => {
  const expected = processingJob();
  const cyclic: any = processingJob();
  cyclic.self = cyclic;
  const fake = fakeDatabase(cyclic);
  const replaced = await saveProcessingIfCurrent(expected, processingJob({ updatedAt: "later" }), {
    openDatabaseImpl: async () => fake.db,
  });
  assert.equal(replaced, false);
  assert.deepEqual(fake.writes, []);
});

test("rolls back the replacement when any write in the transaction fails", async () => {
  const expected = processingJob();
  const replacement = processingJob({ updatedAt: "later" });
  const failedPut = fakeDatabase(expected, undefined, { failProcessingPut: true });
  await assert.rejects(() => saveProcessingIfCurrent(expected, replacement, {
    openDatabaseImpl: async () => failedPut.db,
  }), /Processing write failed/);
  assert.deepEqual(failedPut.processing(), expected);
  assert.deepEqual(failedPut.caseRecord(), { id: "case-1", updatedAt: "old" });
  assert.deepEqual(failedPut.writes, []);
  assert.equal(failedPut.closed(), true);

  const failedActivity = fakeDatabase(expected);
  await assert.rejects(() => saveProcessingIfCurrent(expected, replacement, {
    openDatabaseImpl: async () => failedActivity.db,
    now: () => { throw new Error("Activity timestamp failed"); },
  }), /Activity timestamp failed/);
  assert.deepEqual(failedActivity.processing(), expected);
  assert.deepEqual(failedActivity.caseRecord(), { id: "case-1", updatedAt: "old" });
  assert.deepEqual(failedActivity.writes, []);
  assert.equal(failedActivity.closed(), true);
});

test("rejects a replacement with a changed processing identity before opening storage", async () => {
  let opened = false;
  await assert.rejects(() => saveProcessingIfCurrent(
    processingJob(),
    processingJob({ fileHash: "other" }),
    { openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); } },
  ), /identity is invalid/);
  assert.equal(opened, false);
});
