import assert from "node:assert/strict";
import test from "node:test";
import { CASE_HISTORY_KEY, describeEmptyCaseLibrary, noteLocalCaseStored, readLocalCaseHistory } from "../web/case-history-model.js";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), raw: (key: string) => values.get(key) };
}

test("records only case-history timestamps without case content", () => {
  const storage = memoryStorage();
  assert.equal(noteLocalCaseStored(storage, () => "2026-08-03T11:00:00.000Z"), true);
  assert.deepEqual(readLocalCaseHistory(storage), { version: 1, firstStoredAt: "2026-08-03T11:00:00.000Z", lastStoredAt: "2026-08-03T11:00:00.000Z" });
  assert.equal(storage.raw(CASE_HISTORY_KEY)?.includes("title"), false);
});

test("preserves first storage time and refreshes the latest time", () => {
  const storage = memoryStorage();
  noteLocalCaseStored(storage, () => "2026-08-03T11:00:00.000Z");
  noteLocalCaseStored(storage, () => "2026-08-03T11:30:00.000Z");
  assert.deepEqual(readLocalCaseHistory(storage), { version: 1, firstStoredAt: "2026-08-03T11:00:00.000Z", lastStoredAt: "2026-08-03T11:30:00.000Z" });
});

test("fails open when metadata storage is unavailable or malformed", () => {
  const unavailable = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(noteLocalCaseStored(unavailable), false);
  assert.equal(readLocalCaseHistory(unavailable), null);
  assert.equal(readLocalCaseHistory(memoryStorage({ [CASE_HISTORY_KEY]: "not json" })), null);
});

test("separates first use from an empty library with prior case history", () => {
  assert.equal(describeEmptyCaseLibrary(false).state, "first-use");
  const history = describeEmptyCaseLibrary(true);
  assert.equal(history.state, "history");
  assert.match(history.explanation!, /permanently deleted, cleared with site data, or removed by browser storage management/);
  assert.match(history.instruction!, /cannot determine which happened|encrypted \.casefind backup/);
});
