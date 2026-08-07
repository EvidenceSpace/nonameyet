import assert from "node:assert/strict";
import test from "node:test";

(globalThis as any).location = { pathname: "/" };

let deleteFile: any;
let FileRemovalError: any;

test.before(async () => {
  ({ deleteFile, FileRemovalError } = await import("../web/storage.js"));
});

type RecordMap = Map<string, any>;
type FakeState = Record<string, RecordMap>;

const storeNames = ["files", "processing", "facts", "suggestions", "events", "cases"];

function fileRecord(overrides: Record<string, any> = {}) {
  const original = {
    name: "proof.png",
    type: "image/png",
    size: 68,
    lastModified: 1_700_000_000_000,
    ...(overrides.original || {}),
  };
  return {
    id: "file-1",
    caseId: "case-1",
    name: "proof.png",
    type: "image/png",
    size: 68,
    sha256: "a".repeat(64),
    original,
    createdAt: "2026-08-07T00:00:00.000Z",
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== "original")),
  };
}

function initialState(): FakeState {
  const source = fileRecord();
  return {
    files: new Map([
      [source.id, structuredClone(source)],
      ["file-2", fileRecord({ id: "file-2", name: "other.png", original: { name: "other.png" }, sha256: "b".repeat(64) })],
    ]),
    processing: new Map([[source.id, { fileId: source.id, caseId: source.caseId, status: "failed" }]]),
    facts: new Map(),
    suggestions: new Map(),
    events: new Map(),
    cases: new Map([[source.caseId, { id: source.caseId, title: "Test case", updatedAt: "2026-08-06T00:00:00.000Z" }]]),
  };
}

function cloneState(state: FakeState): FakeState {
  return Object.fromEntries(Object.entries(state).map(([name, values]) => [
    name,
    new Map([...values.entries()].map(([key, value]) => [key, structuredClone(value)])),
  ]));
}

function serialiseState(state: FakeState) {
  return Object.fromEntries(Object.entries(state).map(([name, values]) => [
    name,
    [...values.entries()].sort(([a], [b]) => a.localeCompare(b)),
  ]));
}

class FakeTransaction {
  working: FakeState;
  pending = 0;
  aborted = false;
  complete = false;
  error: Error | null = null;
  oncomplete?: () => void;
  onerror?: () => void;
  onabort?: () => void;

  constructor(public db: FakeDatabase, public names: string[]) {
    this.working = cloneState(db.state);
  }

  objectStore(name: string) {
    if (!this.names.includes(name)) throw new Error(`Store ${name} was not opened.`);
    const values = this.working[name];
    const fail = (operation: string) => {
      if (this.db.failOperation === operation) throw new Error(`Injected ${operation} failure`);
    };
    return {
      get: (key: string) => this.request(() => structuredClone(values.get(key))),
      delete: (key: string) => {
        fail(`${name}.delete`);
        values.delete(key);
        return {};
      },
      put: (value: any) => {
        fail(`${name}.put`);
        const key = value.id ?? value.fileId;
        values.set(key, structuredClone(value));
        return {};
      },
      index: (indexName: string) => ({
        getKey: (expected: string) => this.request(() => {
          for (const [key, value] of values) {
            if (value[indexName] === expected) return key;
          }
          return undefined;
        }),
      }),
    };
  }

  request(action: () => any) {
    const request: any = { result: undefined, error: null, onsuccess: undefined, onerror: undefined };
    this.pending += 1;
    queueMicrotask(() => {
      if (this.aborted) return;
      try {
        request.result = action();
        request.onsuccess?.();
      } catch (error) {
        request.error = error;
        request.onerror?.();
        this.abort(error as Error);
      } finally {
        this.pending -= 1;
        this.scheduleCompletion();
      }
    });
    return request;
  }

  abort(error?: Error) {
    if (this.aborted || this.complete) return;
    this.aborted = true;
    this.error = error || null;
    queueMicrotask(() => this.onabort?.());
  }

  scheduleCompletion() {
    queueMicrotask(() => {
      if (this.aborted || this.complete || this.pending !== 0) return;
      this.complete = true;
      this.db.state = cloneState(this.working);
      this.oncomplete?.();
    });
  }
}

class FakeDatabase {
  lastTransactionStores: string[] = [];
  closed = false;
  constructor(public state: FakeState, public failOperation?: string) {}
  transaction(names: string[], mode: string) {
    assert.equal(mode, "readwrite");
    this.lastTransactionStores = [...names];
    return new FakeTransaction(this, [...names]);
  }
  close() { this.closed = true; }
}

function setup(failOperation?: string) {
  const db = new FakeDatabase(initialState(), failOperation);
  return {
    db,
    openDatabaseImpl: async () => db,
    expected: fileRecord(),
  };
}

async function rejectsWithCode(promise: Promise<any>, code: string) {
  await assert.rejects(promise, (error: any) => error instanceof FileRemovalError && error.code === code);
}

async function expectRollback(failOperation?: string, now: () => string = () => "2026-08-07T01:00:00.000Z") {
  const fixture = setup(failOperation);
  const before = serialiseState(fixture.db.state);
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl, now }), "write_failed");
  assert.deepEqual(serialiseState(fixture.db.state), before);
  assert.equal(fixture.db.closed, true);
}

test("atomically removes the exact current file, processing state, and updates case activity", async () => {
  const fixture = setup();
  const updatedAt = "2026-08-07T01:00:00.000Z";
  assert.equal(await deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl, now: () => updatedAt }), true);
  assert.equal(fixture.db.state.files.has("file-1"), false);
  assert.equal(fixture.db.state.processing.has("file-1"), false);
  assert.equal(fixture.db.state.files.has("file-2"), true);
  assert.equal(fixture.db.state.cases.get("case-1").updatedAt, updatedAt);
  assert.deepEqual(fixture.db.lastTransactionStores, storeNames);
  assert.equal(fixture.db.closed, true);
});

test("rejects a missing current file as stale", async () => {
  const fixture = setup();
  fixture.db.state.files.delete("file-1");
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "stale_file");
});

test("rejects changed enumerable file metadata", async () => {
  const fixture = setup();
  fixture.db.state.files.get("file-1").createdAt = "2026-08-07T00:01:00.000Z";
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "stale_file");
  assert.equal(fixture.db.state.files.has("file-1"), true);
});

test("rejects newly added enumerable file metadata", async () => {
  const fixture = setup();
  fixture.db.state.files.get("file-1").reviewedAt = "2026-08-07T00:01:00.000Z";
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "stale_file");
});

test("rejects changed original-file metadata", async () => {
  const fixture = setup();
  fixture.db.state.files.get("file-1").original.lastModified += 1;
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "stale_file");
});

test("validates removal identity before opening storage", async () => {
  let opened = false;
  const invalid = fileRecord({ sha256: "not-a-digest" });
  await assert.rejects(
    deleteFile(invalid, { openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); } }),
    TypeError,
  );
  assert.equal(opened, false);
});

test("blocks removal when a fact links to the source", async () => {
  const fixture = setup();
  fixture.db.state.facts.set("fact-1", { id: "fact-1", caseId: "case-1", sourceFileId: "file-1" });
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "file_linked");
  assert.equal(fixture.db.state.files.has("file-1"), true);
});

test("blocks removal when a suggestion links to the source", async () => {
  const fixture = setup();
  fixture.db.state.suggestions.set("suggestion-1", { id: "suggestion-1", caseId: "case-1", fileId: "file-1" });
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "file_linked");
});

test("blocks removal when a timeline event links to the source", async () => {
  const fixture = setup();
  fixture.db.state.events.set("event-1", { id: "event-1", caseId: "case-1", sourceFileId: "file-1" });
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "file_linked");
});

test("rejects removal when the owning case is missing", async () => {
  const fixture = setup();
  fixture.db.state.cases.delete("case-1");
  await rejectsWithCode(deleteFile(fixture.expected, { openDatabaseImpl: fixture.openDatabaseImpl }), "case_missing");
  assert.equal(fixture.db.state.files.has("file-1"), true);
});

test("rolls back every write when files.delete fails", async () => {
  await expectRollback("files.delete");
});

test("rolls back every write when processing.delete fails", async () => {
  await expectRollback("processing.delete");
});

test("rolls back every write when cases.put fails", async () => {
  await expectRollback("cases.put");
});

test("rolls back when the activity timestamp cannot be produced", async () => {
  await expectRollback(undefined, () => { throw new Error("Clock unavailable"); });
});

test("propagates storage-open failures without pretending a transaction ran", async () => {
  const failure = new Error("Storage unavailable");
  await assert.rejects(deleteFile(fileRecord(), { openDatabaseImpl: async () => { throw failure; } }), failure);
});
