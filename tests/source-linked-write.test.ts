import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "" },
});

const storageModule = import("../web/storage.js");
const hash = "a".repeat(64);
const caseRecord = { id: "case-1", title: "Source write safety", updatedAt: "old" };
const sourceFile = { id: "file-1", caseId: "case-1", sha256: hash, name: "source.png" };
const sourceReference = { fileId: "file-1", sha256: hash, locator: { kind: "whole_file" } };

const writes = [
  {
    store: "facts", method: "saveFact", operation: "put", errorName: "SourceLinkedWriteError",
    value: { id: "fact-1", caseId: "case-1", sourceFileId: "file-1", sourceReference, value: "Invoice total", status: "confirmed", manuallyEntered: true },
  },
  {
    store: "suggestions", method: "saveSuggestion", operation: "put", errorName: "SourceLinkedWriteError",
    value: { id: "suggestion-1", caseId: "case-1", fileId: "file-1", sourceReference, label: "Invoice total", value: "5000", status: "suggested" },
  },
  {
    store: "processing", method: "saveProcessing", operation: "put", errorName: "SourceLinkedWriteError",
    value: { fileId: "file-1", caseId: "case-1", fileHash: hash, status: "extracting" },
  },
  {
    store: "events", method: "saveEvent", operation: "add", errorName: "EventTransitionError",
    value: {
      id: "event-1", caseId: "case-1", sourceFileId: "file-1", sourceReference,
      eventDate: "2026-08-07", title: "Files delivered", description: "",
      origin: "user_entered", revision: 1,
      createdAt: "2026-08-07T01:00:00.000Z", updatedAt: "2026-08-07T01:00:00.000Z",
    },
  },
] as const;

type FakeOptions = { targetStore: string; file?: unknown; caseValue?: unknown; failTargetWrite?: boolean };
function clone<T>(value: T): T { return value === undefined ? value : structuredClone(value); }

function fakeDatabase({ targetStore, file = sourceFile, caseValue = caseRecord, failTargetWrite = false }: FakeOptions) {
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
        error: null, oncomplete: null, onerror: null, onabort: null,
        abort() { if (!settled) { settled = true; queueMicrotask(() => tx.onabort?.()); } },
        objectStore(name: string) {
          if (name === "files") return { get: (id: string) => request(() => id === (file as any)?.id ? clone(file) : undefined) };
          if (name === "cases") return {
            get: (id: string) => request(() => id === (stagedCase as any)?.id ? clone(stagedCase) : undefined),
            put: (value: unknown) => request(() => { stagedCase = clone(value); stagedWrites.push("cases"); return (value as any)?.id; }),
          };
          if (name === targetStore) {
            const write = (value: unknown, add = false) => request(() => {
              if (failTargetWrite) throw new Error("Linked write failed");
              if (add && stagedTarget !== undefined) throw new Error("Duplicate key");
              stagedTarget = clone(value); stagedWrites.push(targetStore);
              return (value as any)?.id || (value as any)?.fileId;
            });
            return { put: (value: unknown) => write(value), add: (value: unknown) => write(value, true) };
          }
          throw new Error(`Unexpected store ${name}`);
        },
      };
      function finishIfIdle() {
        if (pending || settled) return;
        settled = true; committedTarget = stagedTarget; committedCase = stagedCase;
        committedWrites.push(...stagedWrites); tx.oncomplete?.();
      }
      function request(operation: () => unknown) {
        pending += 1;
        const result: any = { result: undefined, error: null, onsuccess: null };
        queueMicrotask(() => {
          if (settled) { pending -= 1; return; }
          try {
            result.result = operation(); result.onsuccess?.(); pending -= 1; queueMicrotask(finishIfIdle);
          } catch (failure) {
            result.error = failure; tx.error = failure; settled = true; tx.onerror?.(); tx.onabort?.();
          }
        });
        return result;
      }
      return tx;
    },
    close() { closed = true; },
  };
  return {
    db, target: () => clone(committedTarget), currentCase: () => clone(committedCase),
    transactions, writes: committedWrites, closed: () => closed,
  };
}

async function save(method: string, value: unknown, fake: ReturnType<typeof fakeDatabase>) {
  const storage = await storageModule as Record<string, (...args: any[]) => Promise<unknown>>;
  return storage[method](clone(value), {
    openDatabaseImpl: async () => fake.db,
    now: () => "2026-08-07T04:45:00.000Z",
  });
}

test("atomically validates source identity for every source-linked store", async () => {
  for (const entry of writes) {
    const fake = fakeDatabase({ targetStore: entry.store });
    await save(entry.method, entry.value, fake);
    assert.deepEqual(fake.target(), entry.value, entry.store);
    assert.equal((fake.currentCase() as any).updatedAt, "2026-08-07T04:45:00.000Z");
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
      (failure: any) => failure?.name === entry.errorName && failure.code === "source_missing",
      entry.store,
    );
    assert.equal(fake.target(), undefined);
    assert.deepEqual(fake.currentCase(), caseRecord);
    assert.deepEqual(fake.writes, []);
    assert.equal(fake.closed(), true);
  }
});

test("rejects changed source bytes and cross-case source identities", async () => {
  for (const entry of writes) {
    for (const changedFile of [{ ...sourceFile, sha256: "b".repeat(64) }, { ...sourceFile, caseId: "case-2" }]) {
      const fake = fakeDatabase({ targetStore: entry.store, file: changedFile });
      await assert.rejects(() => save(entry.method, entry.value, fake), (failure: any) => failure?.code === "source_changed");
      assert.equal(fake.target(), undefined);
      assert.deepEqual(fake.currentCase(), caseRecord);
      assert.deepEqual(fake.writes, []);
    }
  }
});

test("rejects a missing case without creating an orphaned linked record", async () => {
  for (const entry of writes) {
    const fake = fakeDatabase({ targetStore: entry.store, caseValue: null });
    await assert.rejects(() => save(entry.method, entry.value, fake), (failure: any) => failure?.code === "case_missing");
    assert.equal(fake.target(), undefined);
    assert.equal(fake.currentCase(), null);
    assert.deepEqual(fake.writes, []);
  }
});

test("rolls back case activity when a linked write fails", async () => {
  for (const entry of writes) {
    const fake = fakeDatabase({ targetStore: entry.store, failTargetWrite: true });
    await assert.rejects(() => save(entry.method, entry.value, fake), (failure: any) => failure?.code === "write_failed");
    assert.equal(fake.target(), undefined);
    assert.deepEqual(fake.currentCase(), caseRecord);
    assert.deepEqual(fake.writes, []);
  }
});

test("rejects malformed provenance before opening storage", async () => {
  const storage = await storageModule;
  let opened = false;
  await assert.rejects(
    () => storage.saveFact({ ...writes[0].value, sourceReference: { ...sourceReference, fileId: "other-file" } }, {
      openDatabaseImpl: async () => { opened = true; throw new Error("Storage should not open"); },
    }),
    /Invalid source-linked write identity/,
  );
  assert.equal(opened, false);
});
