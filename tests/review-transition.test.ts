import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { pathname: "", search: "" },
});

const reviewModule = import("../web/review-transition.js");
async function confirmSuggestionAsFact(...args: any[]) {
  const review = await reviewModule;
  return review.confirmSuggestionAsFact(...args);
}
async function markSuggestionUncertain(...args: any[]) {
  const review = await reviewModule;
  return review.markSuggestionUncertain(...args);
}
async function dismissSuggestion(...args: any[]) {
  const review = await reviewModule;
  return review.dismissSuggestion(...args);
}

function suggestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "suggestion-1",
    caseId: "case-1",
    fileId: "file-1",
    label: "Invoice total",
    value: "₹25,000",
    confidence: 0.92,
    status: "suggested",
    aiSuggested: true,
    decidedByUser: false,
    sourceReference: {
      fileId: "file-1",
      sha256: "a".repeat(64),
      locator: { kind: "pdf_text", pageNumber: 1, quote: "Invoice total ₹25,000" },
    },
    createdAt: "2026-08-06T06:00:00.000Z",
    ...overrides,
  };
}

function factFrom(expected: ReturnType<typeof suggestion>, overrides: Record<string, unknown> = {}) {
  return {
    id: "fact-1",
    caseId: expected.caseId,
    label: expected.label,
    type: "other",
    value: expected.value,
    sourceFileId: expected.fileId,
    sourceReference: expected.sourceReference,
    status: "confirmed",
    manuallyEntered: false,
    aiSuggested: true,
    decidedByUser: true,
    createdAt: "2026-08-06T06:01:00.000Z",
    ...overrides,
  };
}

function fakeDatabase(
  initialSuggestion: unknown,
  initialCase: unknown = { id: "case-1", updatedAt: "old" },
  { failFactAdd = false, failSuggestionWrite = false } = {},
) {
  let suggestionValue = structuredClone(initialSuggestion);
  let caseValue = structuredClone(initialCase);
  let factValues = new Map<string, unknown>();
  let closed = false;
  const transactions: Array<{ stores: string[]; mode: string }> = [];
  const writes: string[] = [];

  const db = {
    transaction(storeNames: string[], mode: string) {
      transactions.push({ stores: [...storeNames], mode });
      let stagedSuggestion = structuredClone(suggestionValue);
      let stagedCase = structuredClone(caseValue);
      const stagedFacts = new Map([...factValues].map(([id, value]) => [id, structuredClone(value)]));
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
          if (name === "suggestions") {
            return {
              get(id: string) {
                return request(() => (stagedSuggestion as { id?: string })?.id === id
                  ? structuredClone(stagedSuggestion)
                  : undefined);
              },
              delete(id: string) {
                return request(() => {
                  if (failSuggestionWrite) throw new Error("Suggestion write failed");
                  if ((stagedSuggestion as { id?: string })?.id === id) stagedSuggestion = undefined;
                  stagedWrites.push("suggestions");
                });
              },
              put(value: any) {
                return request(() => {
                  if (failSuggestionWrite) throw new Error("Suggestion write failed");
                  stagedSuggestion = structuredClone(value);
                  stagedWrites.push("suggestions");
                  return value.id;
                });
              },
            };
          }
          if (name === "facts") {
            return {
              add(value: any) {
                return request(() => {
                  if (failFactAdd) throw new Error("Fact write failed");
                  if (stagedFacts.has(value.id)) throw new Error("Fact already exists");
                  stagedFacts.set(value.id, structuredClone(value));
                  stagedWrites.push("facts");
                  return value.id;
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
        suggestionValue = stagedSuggestion;
        caseValue = stagedCase;
        factValues = stagedFacts;
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
    suggestion: () => suggestionValue,
    caseRecord: () => caseValue,
    facts: () => [...factValues.values()],
    transactions,
    writes,
    closed: () => closed,
  };
}

test("atomically confirms only the exact current suggestion", async () => {
  const expected = suggestion();
  const fact = factFrom(expected);
  const fake = fakeDatabase(expected);
  const accepted = await confirmSuggestionAsFact(fact, expected, {
    openDatabaseImpl: async () => fake.db,
    now: () => "2026-08-06T06:02:00.000Z",
  });

  assert.equal(accepted, true);
  assert.equal(fake.suggestion(), undefined);
  assert.deepEqual(fake.facts(), [fact]);
  assert.deepEqual(fake.caseRecord(), { id: "case-1", updatedAt: "2026-08-06T06:02:00.000Z" });
  assert.deepEqual(fake.transactions, [{ stores: ["facts", "suggestions", "cases"], mode: "readwrite" }]);
  assert.deepEqual(fake.writes, ["facts", "suggestions", "cases"]);
  assert.equal(fake.closed(), true);
});

test("accepts a user correction while preserving the exact source reference", async () => {
  const expected = suggestion({ status: "uncertain", updatedAt: "2026-08-06T06:00:30.000Z" });
  const fact = factFrom(expected, { value: "₹24,500", status: "corrected" });
  const fake = fakeDatabase(expected);
  await confirmSuggestionAsFact(fact, expected, {
    openDatabaseImpl: async () => fake.db,
  });
  assert.deepEqual(fake.facts(), [fact]);
  assert.equal(fake.suggestion(), undefined);
});

test("atomically marks aside or dismisses only the exact suggestion", async () => {
  const expected = suggestion();
  const uncertain = fakeDatabase(expected);
  await markSuggestionUncertain(expected, {
    openDatabaseImpl: async () => uncertain.db,
    now: () => "2026-08-06T06:03:00.000Z",
  });
  assert.deepEqual(uncertain.suggestion(), {
    ...expected,
    status: "uncertain",
    updatedAt: "2026-08-06T06:03:00.000Z",
  });
  assert.deepEqual(uncertain.caseRecord(), { id: "case-1", updatedAt: "2026-08-06T06:03:00.000Z" });
  assert.deepEqual(uncertain.transactions, [{ stores: ["suggestions", "cases"], mode: "readwrite" }]);
  assert.deepEqual(uncertain.writes, ["suggestions", "cases"]);
  assert.equal(uncertain.closed(), true);

  const dismissed = fakeDatabase(expected);
  await dismissSuggestion(expected, {
    openDatabaseImpl: async () => dismissed.db,
    now: () => "2026-08-06T06:04:00.000Z",
  });
  assert.equal(dismissed.suggestion(), undefined);
  assert.deepEqual(dismissed.caseRecord(), { id: "case-1", updatedAt: "2026-08-06T06:04:00.000Z" });
  assert.deepEqual(dismissed.writes, ["suggestions", "cases"]);
  assert.equal(dismissed.closed(), true);
});

test("rejects stale non-acceptance decisions without touching current state", async () => {
  const expected = suggestion();
  const current = suggestion({ value: "₹30,000", updatedAt: "later" });
  for (const action of [markSuggestionUncertain, dismissSuggestion]) {
    const fake = fakeDatabase(current);
    await assert.rejects(
      () => action(expected, { openDatabaseImpl: async () => fake.db }),
      (error: any) => error?.code === "stale_suggestion",
    );
    assert.deepEqual(fake.suggestion(), current);
    assert.deepEqual(fake.caseRecord(), { id: "case-1", updatedAt: "old" });
    assert.deepEqual(fake.writes, []);
    assert.equal(fake.closed(), true);
  }
});

test("rolls back non-acceptance decisions when the case or write is unavailable", async () => {
  const expected = suggestion();
  for (const action of [markSuggestionUncertain, dismissSuggestion]) {
    const missingCase = fakeDatabase(expected, null);
    await assert.rejects(
      () => action(expected, { openDatabaseImpl: async () => missingCase.db }),
      (error: any) => error?.code === "case_missing",
    );
    assert.deepEqual(missingCase.suggestion(), expected);
    assert.deepEqual(missingCase.writes, []);

    const failedWrite = fakeDatabase(expected, undefined, { failSuggestionWrite: true });
    await assert.rejects(
      () => action(expected, { openDatabaseImpl: async () => failedWrite.db }),
      /Suggestion write failed/,
    );
    assert.deepEqual(failedWrite.suggestion(), expected);
    assert.deepEqual(failedWrite.caseRecord(), { id: "case-1", updatedAt: "old" });
    assert.deepEqual(failedWrite.writes, []);
  }
});

test("rejects a stale or missing suggestion without writing anything", async () => {
  const expected = suggestion();
  const fact = factFrom(expected);
  for (const current of [undefined, suggestion({ value: "₹30,000", updatedAt: "later" })]) {
    const fake = fakeDatabase(current);
    await assert.rejects(
      () => confirmSuggestionAsFact(fact, expected, { openDatabaseImpl: async () => fake.db }),
      (error: any) => error?.code === "stale_suggestion",
    );
    assert.deepEqual(fake.suggestion(), current);
    assert.deepEqual(fake.facts(), []);
    assert.deepEqual(fake.caseRecord(), { id: "case-1", updatedAt: "old" });
    assert.deepEqual(fake.writes, []);
    assert.equal(fake.closed(), true);
  }
});

test("rolls back when the case is missing or any write fails", async () => {
  const expected = suggestion();
  const fact = factFrom(expected);

  const missingCase = fakeDatabase(expected, null);
  await assert.rejects(
    () => confirmSuggestionAsFact(fact, expected, { openDatabaseImpl: async () => missingCase.db }),
    (error: any) => error?.code === "case_missing",
  );
  assert.deepEqual(missingCase.suggestion(), expected);
  assert.deepEqual(missingCase.facts(), []);
  assert.deepEqual(missingCase.writes, []);

  const failedFact = fakeDatabase(expected, undefined, { failFactAdd: true });
  await assert.rejects(
    () => confirmSuggestionAsFact(fact, expected, { openDatabaseImpl: async () => failedFact.db }),
    /Fact write failed/,
  );
  assert.deepEqual(failedFact.suggestion(), expected);
  assert.deepEqual(failedFact.facts(), []);
  assert.deepEqual(failedFact.caseRecord(), { id: "case-1", updatedAt: "old" });
  assert.deepEqual(failedFact.writes, []);

  const failedTimestamp = fakeDatabase(expected);
  await assert.rejects(
    () => confirmSuggestionAsFact(fact, expected, {
      openDatabaseImpl: async () => failedTimestamp.db,
      now: () => { throw new Error("Timestamp failed"); },
    }),
    (error: any) => error?.code === "write_failed",
  );
  assert.deepEqual(failedTimestamp.suggestion(), expected);
  assert.deepEqual(failedTimestamp.facts(), []);
  assert.deepEqual(failedTimestamp.writes, []);
});

test("rejects invalid decision identity before opening storage", async () => {
  const expected = suggestion();
  let opened = false;
  await assert.rejects(
    () => confirmSuggestionAsFact(
      factFrom(expected, { sourceFileId: "file-2" }),
      expected,
      { openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); } },
    ),
    /Invalid review transition identity/,
  );
  await assert.rejects(
    () => dismissSuggestion(
      suggestion({ decidedByUser: true }),
      { openDatabaseImpl: async () => { opened = true; throw new Error("should not open"); } },
    ),
    /Invalid suggestion disposition identity/,
  );
  assert.equal(opened, false);
});
