import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "", search: "" },
});

const reviewModule = import("../web/review-transition.js");
async function removeFact(...args: any[]) {
  const review = await reviewModule;
  return review.removeFact(...args);
}

function fact(overrides: Record<string, unknown> = {}) {
  return {
    id: "fact-1",
    caseId: "case-1",
    type: "other",
    value: "Invoice total ₹5,000",
    sourceFileId: "file-1",
    sourceReference: {
      fileId: "file-1",
      sha256: "a".repeat(64),
      locator: { kind: "whole_file" },
    },
    status: "confirmed",
    manuallyEntered: true,
    ...overrides,
  };
}

function fakeDatabase(
  initialFact: unknown,
  initialCase: unknown = { id: "case-1", updatedAt: "old" },
  { failDelete = false, failCasePut = false } = {},
) {
  let factValue = structuredClone(initialFact);
  let caseValue = structuredClone(initialCase);
  let closed = false;
  const transactions: Array<{ stores: string[]; mode: string }> = [];
  const writes: string[] = [];

  const db = {
    transaction(storeNames: string[], mode: string) {
      transactions.push({ stores: [...storeNames], mode });
      let stagedFact = structuredClone(factValue);
      let stagedCase = structuredClone(caseValue);
      const stagedWrites: string[] = [];
      let pending = 0;
      let completed = false;
      const tx: any = {
        error: null,
        oncomplete: null,
        onerror: null,
        onabort: null,
        abort() {
          if (completed) return;
          completed = true;
          queueMicrotask(() => tx.onabort?.());
        },
        objectStore(name: string) {
          if (name === "facts") {
            return {
              get(id: string) {
                return request(() => (stagedFact as { id?: string })?.id === id
                  ? structuredClone(stagedFact)
                  : undefined);
              },
              delete(id: string) {
                return request(() => {
                  if (failDelete) throw new Error("Fact delete failed");
                  if ((stagedFact as { id?: string })?.id === id) stagedFact = undefined;
                  stagedWrites.push("facts");
                });
              },
            };
          }
          if (name === "cases") {
            return {
              get(id: string) {
                return request(() => (stagedCase as { id?: string })?.id === id
                  ? structuredClone(stagedCase)
                  : undefined);
              },
              put(value: any) {
                return request(() => {
                  if (failCasePut) throw new Error("Case write failed");
                  stagedCase = structuredClone(value);
                  stagedWrites.push("cases");
                  return value.id;
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
        factValue = stagedFact;
        caseValue = stagedCase;
        writes.push(...stagedWrites);
        tx.oncomplete?.();
      }

      function request(operation: () => unknown) {
        pending += 1;
        const result: any = { result: undefined, error: null, onsuccess: null };
        queueMicrotask(() => {
          if (completed) return;
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
    fact: () => factValue,
    caseRecord: () => caseValue,
    transactions,
    writes,
    closed: () => closed,
  };
}

test("atomically removes only the exact current legacy fact", async () => {
  const expected = fact();
  const fake = fakeDatabase(expected);
  const removed = await removeFact(expected, {
    openDatabaseImpl: async () => fake.db,
    now: () => "2026-08-06T18:30:00.000Z",
  });

  assert.equal(removed, true);
  assert.equal(fake.fact(), undefined);
  assert.deepEqual(fake.caseRecord(), { id: "case-1", updatedAt: "2026-08-06T18:30:00.000Z" });
  assert.deepEqual(fake.transactions, [{ stores: ["facts", "cases"], mode: "readwrite" }]);
  assert.deepEqual(fake.writes, ["facts", "cases"]);
  assert.equal(fake.closed(), true);
});

test("rejects missing and stale facts without changing current state", async () => {
  const expected = fact();
  for (const current of [undefined, fact({ value: "Invoice total ₹6,000", updatedAt: "later" })]) {
    const fake = fakeDatabase(current);
    await assert.rejects(
      () => removeFact(expected, { openDatabaseImpl: async () => fake.db }),
      (error: any) => error?.code === "stale_fact",
    );
    assert.deepEqual(fake.fact(), current);
    assert.deepEqual(fake.caseRecord(), { id: "case-1", updatedAt: "old" });
    assert.deepEqual(fake.writes, []);
    assert.equal(fake.closed(), true);
  }
});

test("rolls back when the case, timestamp, or either write is unavailable", async () => {
  const expected = fact();
  const missingCase = fakeDatabase(expected, null);
  await assert.rejects(
    () => removeFact(expected, { openDatabaseImpl: async () => missingCase.db }),
    (error: any) => error?.code === "case_missing",
  );
  assert.deepEqual(missingCase.fact(), expected);
  assert.deepEqual(missingCase.writes, []);

  for (const options of [{ failDelete: true }, { failCasePut: true }]) {
    const failedWrite = fakeDatabase(expected, undefined, options);
    await assert.rejects(
      () => removeFact(expected, { openDatabaseImpl: async () => failedWrite.db }),
      /Fact delete failed|Case write failed/,
    );
    assert.deepEqual(failedWrite.fact(), expected);
    assert.deepEqual(failedWrite.caseRecord(), { id: "case-1", updatedAt: "old" });
    assert.deepEqual(failedWrite.writes, []);
    assert.equal(failedWrite.closed(), true);
  }

  const failedTimestamp = fakeDatabase(expected);
  await assert.rejects(
    () => removeFact(expected, {
      openDatabaseImpl: async () => failedTimestamp.db,
      now: () => { throw new Error("Timestamp failed"); },
    }),
    (error: any) => error?.code === "write_failed",
  );
  assert.deepEqual(failedTimestamp.fact(), expected);
  assert.deepEqual(failedTimestamp.writes, []);
  assert.equal(failedTimestamp.closed(), true);
});

test("rejects invalid fact identity before opening storage", async () => {
  let opened = false;
  await assert.rejects(
    () => removeFact(
      fact({ sourceFileId: "", manuallyEntered: "yes" }),
      { openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); } },
    ),
    /Invalid fact removal identity/,
  );
  assert.equal(opened, false);
});
