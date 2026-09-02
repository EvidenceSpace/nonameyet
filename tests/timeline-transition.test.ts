import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "" },
});

const storageModule = import("../web/storage.js");

type StoreName = "events" | "files" | "cases";
type State = Record<StoreName, Map<string, any>>;

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const caseRecord = { id: "case-1", title: "Timeline integrity", updatedAt: "old" };
const sourceFile = { id: "file-1", caseId: "case-1", sha256: hashA, name: "proof.pdf" };

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    caseId: "case-1",
    eventDate: "2026-08-07",
    title: "Files delivered",
    description: "Delivery recorded in the source.",
    sourceFileId: "file-1",
    sourceReference: {
      fileId: "file-1",
      sha256: hashA,
      locator: { kind: "pdf_page", page: 2, quote: "Files attached." },
    },
    origin: "user_entered",
    revision: 1,
    createdAt: "2026-08-07T01:00:00.000Z",
    updatedAt: "2026-08-07T01:00:00.000Z",
    ...overrides,
  };
}

function replacement(expected = event(), overrides: Record<string, unknown> = {}) {
  return {
    ...expected,
    title: "Delivery confirmed",
    revision: expected.revision + 1,
    updatedAt: "2026-08-07T02:00:00.000Z",
    ...overrides,
  };
}

function initialState(currentEvent: any = undefined): State {
  return {
    events: new Map(currentEvent ? [[currentEvent.id, structuredClone(currentEvent)]] : []),
    files: new Map([[sourceFile.id, structuredClone(sourceFile)]]),
    cases: new Map([[caseRecord.id, structuredClone(caseRecord)]]),
  };
}

function cloneState(state: State): State {
  return Object.fromEntries(Object.entries(state).map(([name, values]) => [
    name,
    new Map([...values.entries()].map(([key, value]) => [key, structuredClone(value)])),
  ])) as State;
}

function serialise(state: State) {
  return Object.fromEntries(Object.entries(state).map(([name, values]) => [name, [...values.entries()]]));
}

class FakeTransaction {
  working: State;
  pending = 0;
  settled = false;
  error: Error | null = null;
  oncomplete?: () => void;
  onerror?: () => void;
  onabort?: () => void;

  constructor(public db: FakeDatabase, public names: StoreName[]) {
    this.working = cloneState(db.state);
  }

  objectStore(name: StoreName) {
    if (!this.names.includes(name)) throw new Error(`Store ${name} was not opened.`);
    const values = this.working[name];
    const mutate = (operation: string, action: () => unknown) => this.request(() => {
      if (this.db.failOperation === operation) throw new Error(`Injected ${operation} failure`);
      return action();
    });
    return {
      get: (key: string) => this.request(() => {
        this.db.reads.push(`${name}.get:${key}`);
        return structuredClone(values.get(key));
      }),
      add: (value: any) => mutate(`${name}.add`, () => {
        if (values.has(value.id)) {
          const failure = new Error("Key already exists");
          failure.name = "ConstraintError";
          throw failure;
        }
        values.set(value.id, structuredClone(value));
        this.db.operations.push(`${name}.add`);
        return value.id;
      }),
      put: (value: any) => mutate(`${name}.put`, () => {
        values.set(value.id, structuredClone(value));
        this.db.operations.push(`${name}.put`);
        return value.id;
      }),
      delete: (key: string) => mutate(`${name}.delete`, () => {
        values.delete(key);
        this.db.operations.push(`${name}.delete`);
        return undefined;
      }),
    };
  }

  request(action: () => unknown) {
    this.pending += 1;
    const request: any = { result: undefined, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => {
      if (this.settled) { this.pending -= 1; return; }
      try {
        request.result = action();
        request.onsuccess?.();
      } catch (failure) {
        request.error = failure;
        this.error = failure as Error;
        request.onerror?.();
        this.abort(failure as Error, true);
      } finally {
        this.pending -= 1;
        this.scheduleCompletion();
      }
    });
    return request;
  }

  abort(error?: Error, fireError = false) {
    if (this.settled) return;
    this.settled = true;
    this.error = error || this.error;
    queueMicrotask(() => {
      if (fireError) this.onerror?.();
      this.onabort?.();
    });
  }

  scheduleCompletion() {
    queueMicrotask(() => {
      if (this.settled || this.pending !== 0) return;
      this.settled = true;
      this.db.state = cloneState(this.working);
      this.oncomplete?.();
    });
  }
}

class FakeDatabase {
  state: State;
  closed = false;
  transactions: Array<{ stores: StoreName[]; mode: string }> = [];
  operations: string[] = [];
  reads: string[] = [];

  constructor(state = initialState(), public failOperation?: string) {
    this.state = cloneState(state);
  }

  transaction(names: StoreName[], mode: string) {
    this.transactions.push({ stores: [...names], mode });
    return new FakeTransaction(this, [...names]);
  }

  close() { this.closed = true; }
}

async function storage() {
  return storageModule;
}

function options(db: FakeDatabase, now = () => "2026-08-07T03:00:00.000Z") {
  return { openDatabaseImpl: async () => db, now };
}

async function rejectsCode(promise: Promise<unknown>, code: string) {
  const { EventTransitionError } = await storage();
  await assert.rejects(
    promise,
    (failure: any) => failure instanceof EventTransitionError && failure.code === code,
  );
}

test("validates complete event snapshots, locators, exact values, and replacements", async () => {
  const api = await storage();
  const expected = event();
  const next = replacement(expected);
  assert.equal(api.validEventLocator({ kind: "whole_file" }), true);
  assert.equal(api.validEventLocator({ kind: "pdf_page", page: 3, quote: "Exact text" }), true);
  assert.equal(api.validEventLocator({ kind: "pdf_page", page: 0 }), false);
  assert.equal(api.validEventLocator({ kind: "whole_file", page: 1 }), false);
  assert.equal(api.validEventSnapshot(expected), true);
  assert.equal(api.validEventSnapshot(event({ eventDate: "2026-02-30" })), false);
  assert.equal(api.validEventSnapshot(event({ sourceReference: { fileId: "other", sha256: hashA, locator: { kind: "whole_file" } } })), false);
  assert.equal(api.eventValuesMatch(expected, structuredClone(expected)), true);
  assert.equal(api.eventValuesMatch(expected, event({ reviewedAt: "later" })), false);
  assert.equal(api.validEventReplacement(expected, next), true);
  assert.equal(api.validEventReplacement(expected, replacement(expected, { id: "event-2" })), false);
  assert.equal(api.validEventReplacement(expected, replacement(expected, { revision: 3 })), false);
  assert.equal(api.validEventReplacement(expected, replacement(expected, { createdAt: "later" })), false);
});

test("creates with events.add and updates case activity in one transaction", async () => {
  const api = await storage();
  const db = new FakeDatabase();
  const value = event();
  assert.equal(await api.createEvent(value, options(db)), "event-1");
  assert.deepEqual(db.state.events.get("event-1"), value);
  assert.equal(db.state.cases.get("case-1").updatedAt, "2026-08-07T03:00:00.000Z");
  assert.deepEqual(db.transactions, [{ stores: ["events", "files", "cases"], mode: "readwrite" }]);
  assert.deepEqual(db.operations, ["events.add", "cases.put"]);
  assert.equal(db.closed, true);
});

test("collision-safe creation rejects an existing ID and rolls back case activity", async () => {
  const api = await storage();
  const current = event({ title: "Already stored" });
  const db = new FakeDatabase(initialState(current));
  const before = serialise(db.state);
  await rejectsCode(api.saveEvent(event(), options(db)), "write_failed");
  assert.deepEqual(serialise(db.state), before);
  assert.equal(db.closed, true);
});

test("creation rejects missing, changed, and cross-case sources", async () => {
  const api = await storage();
  const fixtures = [
    { file: undefined, code: "source_missing" },
    { file: { ...sourceFile, sha256: hashB }, code: "source_changed" },
    { file: { ...sourceFile, caseId: "case-2" }, code: "source_changed" },
  ];
  for (const fixture of fixtures) {
    const state = initialState();
    state.files.clear();
    if (fixture.file) state.files.set("file-1", fixture.file);
    const db = new FakeDatabase(state);
    await rejectsCode(api.createEvent(event(), options(db)), fixture.code);
    assert.equal(db.state.events.size, 0);
    assert.deepEqual(db.state.cases.get("case-1"), caseRecord);
  }
});

test("creation rejects a missing case without creating an orphan", async () => {
  const api = await storage();
  const state = initialState();
  state.cases.clear();
  const db = new FakeDatabase(state);
  await rejectsCode(api.createEvent(event(), options(db)), "case_missing");
  assert.equal(db.state.events.size, 0);
});

test("replaces only the exact current event and increments revision once", async () => {
  const api = await storage();
  const expected = event();
  const next = replacement(expected, {
    sourceFileId: "file-2",
    sourceReference: { fileId: "file-2", sha256: hashB, locator: { kind: "whole_file" } },
  });
  const state = initialState(expected);
  state.files.set("file-2", { id: "file-2", caseId: "case-1", sha256: hashB, name: "reply.png" });
  const db = new FakeDatabase(state);
  assert.equal(await api.saveEventIfCurrent(expected, next, options(db)), "event-1");
  assert.deepEqual(db.state.events.get("event-1"), next);
  assert.equal(db.state.events.get("event-1").revision, 2);
  assert.equal(db.state.events.get("event-1").createdAt, expected.createdAt);
  assert.deepEqual(db.transactions, [{ stores: ["events", "files", "cases"], mode: "readwrite" }]);
  assert.deepEqual(db.operations, ["events.put", "cases.put"]);
});

test("replacement rejects missing or changed current events as stale", async () => {
  const api = await storage();
  const expected = event();
  for (const current of [undefined, event({ title: "Newer title", revision: 2 }), event({ reviewedAt: "later" })]) {
    const db = new FakeDatabase(initialState(current));
    const before = serialise(db.state);
    await rejectsCode(api.saveEventIfCurrent(expected, replacement(expected), options(db)), "stale_event");
    assert.deepEqual(serialise(db.state), before);
  }
});

test("replacement validates the new source and parent case in the same transaction", async () => {
  const api = await storage();
  const expected = event();
  for (const [mutate, code] of [
    [(state: State) => state.files.clear(), "source_missing"],
    [(state: State) => { state.files.get("file-1").sha256 = hashB; }, "source_changed"],
    [(state: State) => state.cases.clear(), "case_missing"],
  ] as const) {
    const state = initialState(expected);
    mutate(state);
    const db = new FakeDatabase(state);
    await rejectsCode(api.saveEventIfCurrent(expected, replacement(expected), options(db)), code);
    assert.deepEqual(db.state.events.get("event-1"), expected);
  }
});

test("rejects malformed replacements before opening storage", async () => {
  const api = await storage();
  let opened = false;
  await assert.rejects(
    api.saveEventIfCurrent(event(), replacement(event(), { revision: 4 }), {
      openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); },
    }),
    /Invalid timeline event transition/,
  );
  assert.equal(opened, false);
});

test("removes only the exact current event and does not require its source", async () => {
  const api = await storage();
  const expected = event();
  const state = initialState(expected);
  state.files.clear();
  const db = new FakeDatabase(state);
  assert.equal(await api.deleteEvent(expected, options(db)), true);
  assert.equal(db.state.events.size, 0);
  assert.equal(db.state.cases.get("case-1").updatedAt, "2026-08-07T03:00:00.000Z");
  assert.deepEqual(db.transactions, [{ stores: ["events", "cases"], mode: "readwrite" }]);
  assert.deepEqual(db.operations, ["events.delete", "cases.put"]);
});

test("removal rejects stale events and a missing case without deleting", async () => {
  const api = await storage();
  const expected = event();
  const staleDb = new FakeDatabase(initialState(event({ title: "Changed elsewhere" })));
  await rejectsCode(api.deleteEvent(expected, options(staleDb)), "stale_event");
  assert.equal(staleDb.state.events.size, 1);

  const state = initialState(expected);
  state.cases.clear();
  const missingCaseDb = new FakeDatabase(state);
  await rejectsCode(api.deleteEvent(expected, options(missingCaseDb)), "case_missing");
  assert.deepEqual(missingCaseDb.state.events.get("event-1"), expected);
});

test("failed event or case writes and invalid timestamps roll back every record", async () => {
  const api = await storage();
  const expected = event();
  for (const [operation, action] of [
    ["events.add", (db: FakeDatabase) => api.createEvent(event({ id: "event-new" }), options(db))],
    ["events.put", (db: FakeDatabase) => api.saveEventIfCurrent(expected, replacement(expected), options(db))],
    ["events.delete", (db: FakeDatabase) => api.deleteEvent(expected, options(db))],
    ["cases.put", (db: FakeDatabase) => api.saveEventIfCurrent(expected, replacement(expected), options(db))],
  ] as const) {
    const state = initialState(operation === "events.add" ? undefined : expected);
    const db = new FakeDatabase(state, operation);
    const before = serialise(db.state);
    await rejectsCode(action(db), "write_failed");
    assert.deepEqual(serialise(db.state), before, operation);
    assert.equal(db.closed, true);
  }

  const db = new FakeDatabase(initialState(expected));
  const before = serialise(db.state);
  await rejectsCode(
    api.saveEventIfCurrent(expected, replacement(expected), options(db, () => "")),
    "write_failed",
  );
  assert.deepEqual(serialise(db.state), before);
});

test("storage-open failures are structured and do not pretend a transaction ran", async () => {
  const api = await storage();
  const cause = new Error("Storage unavailable");
  await assert.rejects(
    api.createEvent(event(), { openDatabaseImpl: async () => { throw cause; } }),
    (failure: any) => failure?.name === "EventTransitionError"
      && failure.code === "write_failed"
      && failure.cause === cause,
  );
});

test("rejects non-canonical snapshots and compares canonical fields independent of key order", async () => {
  const api = await storage();
  const expected = event();
  const reordered = {
    updatedAt: expected.updatedAt,
    createdAt: expected.createdAt,
    revision: expected.revision,
    origin: expected.origin,
    sourceReference: {
      locator: { quote: "Files attached.", page: 2, kind: "pdf_page" },
      sha256: hashA,
      fileId: "file-1",
    },
    sourceFileId: expected.sourceFileId,
    description: expected.description,
    title: expected.title,
    eventDate: expected.eventDate,
    caseId: expected.caseId,
    id: expected.id,
  };
  assert.equal(api.eventValuesMatch(expected, reordered), true);
  assert.equal(api.validEventLocator({ kind: "whole_file", extra: true }), false);
  assert.equal(api.validEventLocator({ kind: "pdf_page", page: 2, extra: true }), false);
  assert.equal(api.validEventSnapshot(event({ createdAt: "not-a-timestamp" })), false);
  assert.equal(api.validEventSnapshot(event({ updatedAt: "2026-08-07T01:00:00Z" })), false);
  assert.equal(api.validEventSnapshot(event({ reviewedAt: "later" })), false);
  assert.equal(api.validEventSnapshot(event({
    sourceReference: { ...expected.sourceReference, extra: true },
  })), false);
});

test("creation accepts only the first revision before storage opens", async () => {
  const api = await storage();
  let opened = false;
  await assert.rejects(
    api.createEvent(event({ revision: 2 }), {
      openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); },
    }),
    /Invalid timeline event transition/,
  );
  assert.equal(opened, false);
});

test("replacement validates the rendered source before binding a different source", async () => {
  const api = await storage();
  const expected = event();
  const next = replacement(expected, {
    sourceFileId: "file-2",
    sourceReference: { fileId: "file-2", sha256: hashB, locator: { kind: "whole_file" } },
  });
  for (const [oldFile, code] of [
    [undefined, "source_missing"],
    [{ ...sourceFile, sha256: "c".repeat(64) }, "source_changed"],
  ] as const) {
    const state = initialState(expected);
    state.files.clear();
    if (oldFile) state.files.set("file-1", oldFile);
    state.files.set("file-2", { id: "file-2", caseId: "case-1", sha256: hashB, name: "reply.png" });
    const db = new FakeDatabase(state);
    const before = serialise(db.state);
    await rejectsCode(api.saveEventIfCurrent(expected, next, options(db)), code);
    assert.deepEqual(serialise(db.state), before);
    assert.equal(db.reads.includes("files.get:file-2"), false);
  }
});

test("same-source replacement reuses one validated source read while source changes read both", async () => {
  const api = await storage();
  const expected = event();
  const sameSourceDb = new FakeDatabase(initialState(expected));
  await api.saveEventIfCurrent(expected, replacement(expected), options(sameSourceDb));
  assert.deepEqual(sameSourceDb.reads.filter((entry) => entry.startsWith("files.get:")), ["files.get:file-1"]);

  const state = initialState(expected);
  state.files.set("file-2", { id: "file-2", caseId: "case-1", sha256: hashB, name: "reply.png" });
  const changedSourceDb = new FakeDatabase(state);
  await api.saveEventIfCurrent(expected, replacement(expected, {
    sourceFileId: "file-2",
    sourceReference: { fileId: "file-2", sha256: hashB, locator: { kind: "whole_file" } },
  }), options(changedSourceDb));
  assert.deepEqual(changedSourceDb.reads.filter((entry) => entry.startsWith("files.get:")), [
    "files.get:file-1",
    "files.get:file-2",
  ]);
});

test("transaction setup failures and malformed activity timestamps are structured and atomic", async () => {
  const api = await storage();
  const setupFailure = new Error("Transaction unavailable");
  let closed = false;
  await assert.rejects(
    api.createEvent(event(), {
      openDatabaseImpl: async () => ({
        transaction() { throw setupFailure; },
        close() { closed = true; },
      }),
    }),
    (failure: any) => failure?.name === "EventTransitionError"
      && failure.code === "write_failed"
      && failure.cause === setupFailure,
  );
  assert.equal(closed, true);

  const expected = event();
  const db = new FakeDatabase(initialState(expected));
  const before = serialise(db.state);
  await rejectsCode(
    api.saveEventIfCurrent(expected, replacement(expected), options(db, () => "not-a-timestamp")),
    "write_failed",
  );
  assert.deepEqual(serialise(db.state), before);
});
