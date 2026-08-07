import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "" },
});

const storageModule = import("../web/storage.js");

const caseRecord = { id: "case-1", title: "Source write safety", updatedAt: "old" };
const sourceFile = { id: "file-1", caseId: "case-1", sha256: "hash-1", name: "source.png" };
const sourceReference = { fileId: "file-1", sha256: "hash-1", locator: { kind: "whole_file" } };

const writes = [
  {
    store: "facts",
    method: "saveFact",
    value: {
      id: "fact-1", caseId: "case-1", sourceFileId: "file-1", sourceReference,
      value: "Invoice total", status: "confirmed", manuallyEntered: true,
    },
  },
  {
    store: "suggestions",
    method: "saveSuggestion",
    value: {
      id: "suggestion-1", caseId: "case-1", fileId: "file-1", sourceReference,
      label: "Invoice total", value: "5000", status: "suggested",
    },
  },
  {
    store: "processing",
    method: "saveProcessing",
    value: {
      fileId: "file-1", caseId: "case-1", fileHash: "hash-1", status: "extracting",
    },
  },
  {
    store: "events",
    method: "saveEvent",
    value: {
      id: "event-1", caseId: "case-1", sourceFileId: "file-1", sourceReference,
      eventDate: "2026-08-07", title: "Files delivered",
    },
  },
] as const;

type FakeOptions = {
  targetStore: string;
  file?: unknown;
  caseValue?: unknown;
  failTargetPut?: boolean;
};

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

function fakeDatabase({
  targetStore,
  file = sourceFile,
  caseValue = caseRecord,
  failTargetPut = false,
}: FakeOptions) {
  let committedTarget: unknown;
  let committedCase = clone(caseValue);
  let closed = false;
  const transactions: Array<{ stores: string[]; mode: string }> = [];
  const committedWrites: string[] = [];

  const db = {
    transaction(storeNames: string[], mode: string) {
      transactions.push({ stores: [...storeNames], mode });
      let stagedTarget = clone(committedTarget);
      let stagedCase = clone(committedCase);
      const stagedWrites: string[] = [];
      let pending = 0;
      let settled = false;
      const tx: any = {
        error: null,
        oncomplete: null,
        onerror: null,
        onabort: null,
        abort() {
          if (settled) return;
          settled = true;
          queueMicrotask(() => tx.onabort?.());
        },
        objectStore(name: string) {
          if (name === "files") {
            return {
              get(id: string) {
                return request(() => (id === (file as { id?: string } | undefined)?.id ? clone(file) : undefined));
              },
            };
          }
          if (name === "cases") {
            return {
              get(id: string) {
                return request(() => (id === (stagedCase as { id?: string } | undefined)?.id ? clone(stagedCase) : undefined));
              },
              put(value: unknown) {
                return request(() => {
                  stagedCase = clone(value);
                  stagedWrites.push("cases");
                  return (value as { id?: string })?.id;
                });
              },
            };
          }
          if (name === targetStore) {
            return {
              put(value: unknown) {
                return request(() => {
                  if (failTargetPut) throw new Error("Linked write failed");
                  stagedTarget = clone(value);
                  stagedWrites.push(targetStore);
                  return (value as { id?: string; fileId?: string })?.id
                    || (value as { fileId?: string })?.fileId;
                });
              },
            };
          }
          throw new Error(`Unexpected store ${name}`);
        },
      };

      function finishIfIdle() {
        if (pending || settled) return;
        settled = true;
        committedTarget = stagedTarget;
        committedCase = stagedCase;
        committedWrites.push(...stagedWrites);
        tx.oncomplete?.();
      }

      function request(operation: () => unknown) {
        pending += 1;
        const result: any = { result: undefined, error: null, onsuccess: null };
        queueMicrotask(() => {
          if (settled) { pending -= 1; return; }
          try {
            result.result = operation();
            result.onsuccess?.();
            pending -= 1;
            queueMicrotask(finishIfIdle);
          } catch (error) {
            result.error = error;
            tx.error = error;
            settled = true;
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
    target: () => clone(committedTarget),
    currentCase: () => clone(committedCase),
    transactions,
    writes: committedWrites,
    closed: () => closed,
  };
}

async function save(method: string, value: unknown, fake: ReturnType<typeof fakeDatabase>, now = "2026-08-07T04:45:00.000Z") {
  const storage = await storageModule as Record<string, (...args: any[]) => Promise<unknown>>;
  return storage[method](clone(value), {
    openDatabaseImpl: async () => fake.db,
    now: () => now,
  });
}

test("atomically validates source identity for every source-linked store", async () => {
  for (const entry of writes) {
    const fake = fakeDatabase({ targetStore: entry.store });
    await save(entry.method, entry.value, fake);

    assert.deepEqual(fake.target(), entry.value, entry.store);
    assert.equal((fake.currentCase() as { updatedAt: string }).updatedAt, "2026-08-07T04:45:00.000Z");
    assert.deepEqual(fake.transactions, [{ stores: [entry.store, "files", "cases"], mode: "readwrite" }]);
    assert.deepEqual(fake.writes, [entry.store, "cases"]);
    assert.equal(fake.closed(), true);
  }
});

test("rejects writes after their source was deleted", async () => {
  for (const entry of writes) {
    const fake = fakeDatabase({ targetStore: entry.store, file: null });
    await assert.rejects(
      () => save(entry.method, entry.value, fake),
      (error: any) => error?.name === "SourceLinkedWriteError" && error.code === "source_missing",
      entry.store,
    );
    assert.equal(fake.target(), undefined);
    assert.deepEqual(fake.currentCase(), caseRecord);
    assert.deepEqual(fake.writes, []);
    assert.equal(fake.closed(), true);
  }
});

test("rejects changed source bytes and cross-case source identities", async () => {
  for (const changedFile of [
    { ...sourceFile, sha256: "different-hash" },
    { ...sourceFile, caseId: "case-2" },
  ]) {
    const fake = fakeDatabase({ targetStore: "facts", file: changedFile });
    await assert.rejects(
      () => save("saveFact", writes[0].value, fake),
      (error: any) => error?.code === "source_changed",
    );
    assert.equal(fake.target(), undefined);
    assert.deepEqual(fake.currentCase(), caseRecord);
    assert.deepEqual(fake.writes, []);
  }
});

test("rejects a missing case without creating an orphaned linked record", async () => {
  const fake = fakeDatabase({ targetStore: "events", caseValue: null });
  await assert.rejects(
    () => save("saveEvent", writes[3].value, fake),
    (error: any) => error?.code === "case_missing",
  );
  assert.equal(fake.target(), undefined);
  assert.equal(fake.currentCase(), null);
  assert.deepEqual(fake.writes, []);
});

test("rolls back case activity when a linked write fails", async () => {
  const fake = fakeDatabase({ targetStore: "suggestions", failTargetPut: true });
  await assert.rejects(
    () => save("saveSuggestion", writes[1].value, fake),
    (error: any) => error?.name === "SourceLinkedWriteError" && error.code === "write_failed",
  );
  assert.equal(fake.target(), undefined);
  assert.deepEqual(fake.currentCase(), caseRecord);
  assert.deepEqual(fake.writes, []);
});

test("rejects malformed provenance before opening storage", async () => {
  const storage = await storageModule;
  let opened = false;
  await assert.rejects(
    () => storage.saveFact({
      ...writes[0].value,
      sourceReference: { ...sourceReference, fileId: "other-file" },
    }, {
      openDatabaseImpl: async () => {
        opened = true;
        throw new Error("Storage should not open");
      },
    }),
    /Invalid source-linked write identity/,
  );
  assert.equal(opened, false);
});
