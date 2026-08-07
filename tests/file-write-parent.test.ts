import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "" },
});

const storageModule = import("../web/storage.js");
const timestamp = "2026-08-07T05:30:00.000Z";
const caseRecord = { id: "case-1", title: "Upload parent safety", updatedAt: "old" };
const fileRecord = {
  id: "file-1",
  caseId: "case-1",
  name: "source.png",
  type: "image/png",
  size: 4,
  sha256: "a".repeat(64),
  createdAt: "2026-08-07T05:00:00.000Z",
  original: {
    name: "source.png",
    type: "image/png",
    size: 4,
    lastModified: 1_786_078_800_000,
  },
};

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

function fakeDatabase({ caseValue = caseRecord, failFileAdd = false } = {}) {
  let committedFile: unknown;
  let committedCase = clone(caseValue);
  let closed = false;
  const transactions: Array<{ stores: string[]; mode: string }> = [];
  const writes: string[] = [];

  const db = {
    transaction(storeNames: string[], mode: string) {
      transactions.push({ stores: [...storeNames], mode });
      let stagedFile = clone(committedFile);
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
          if (name === "cases") {
            return {
              get(id: string) {
                return request(() => (id === (stagedCase as { id?: string } | undefined)?.id
                  ? clone(stagedCase)
                  : undefined));
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
          if (name === "files") {
            return {
              add(value: unknown) {
                return request(() => {
                  if (failFileAdd) throw new Error("Injected file write failure");
                  stagedFile = clone(value);
                  stagedWrites.push("files");
                  return (value as { id?: string })?.id;
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
        committedFile = stagedFile;
        committedCase = stagedCase;
        writes.push(...stagedWrites);
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
    file: () => clone(committedFile),
    currentCase: () => clone(committedCase),
    transactions,
    writes,
    closed: () => closed,
  };
}

async function save(fake: ReturnType<typeof fakeDatabase>, value = fileRecord, now = timestamp) {
  const storage = await storageModule;
  return storage.saveFile(clone(value), {
    openDatabaseImpl: async () => fake.db,
    now: () => now,
  });
}

test("saves an original and updates its existing parent case atomically", async () => {
  const fake = fakeDatabase();
  assert.equal(await save(fake), "file-1");
  assert.deepEqual(fake.file(), fileRecord);
  assert.deepEqual(fake.currentCase(), { ...caseRecord, updatedAt: timestamp });
  assert.deepEqual(fake.transactions, [{ stores: ["files", "cases"], mode: "readwrite" }]);
  assert.deepEqual(fake.writes, ["files", "cases"]);
  assert.equal(fake.closed(), true);
});

test("does not save an original after its parent case was deleted", async () => {
  const fake = fakeDatabase({ caseValue: null });
  await assert.rejects(
    () => save(fake),
    (error: any) => error?.name === "FileWriteError" && error.code === "case_missing",
  );
  assert.equal(fake.file(), undefined);
  assert.equal(fake.currentCase(), null);
  assert.deepEqual(fake.writes, []);
  assert.equal(fake.closed(), true);
});

test("rolls back case activity when the original write fails", async () => {
  const fake = fakeDatabase({ failFileAdd: true });
  await assert.rejects(
    () => save(fake),
    (error: any) => error?.name === "FileWriteError" && error.code === "write_failed",
  );
  assert.equal(fake.file(), undefined);
  assert.deepEqual(fake.currentCase(), caseRecord);
  assert.deepEqual(fake.writes, []);
});

test("rolls back when the activity timestamp is invalid", async () => {
  const fake = fakeDatabase();
  await assert.rejects(
    () => save(fake, fileRecord, ""),
    (error: any) => error?.name === "FileWriteError" && error.code === "write_failed",
  );
  assert.equal(fake.file(), undefined);
  assert.deepEqual(fake.currentCase(), caseRecord);
  assert.deepEqual(fake.writes, []);
});

test("rejects malformed originals before opening storage", async () => {
  const storage = await storageModule;
  let opened = false;
  await assert.rejects(
    () => storage.saveFile({ ...fileRecord, sha256: "not-a-digest" }, {
      openDatabaseImpl: async () => {
        opened = true;
        throw new Error("Storage should not open");
      },
    }),
    /Invalid source file identity/,
  );
  assert.equal(opened, false);
});
