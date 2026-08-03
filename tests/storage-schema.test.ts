import assert from "node:assert/strict";
import test from "node:test";
import { DATABASE_SCHEMA, DB_VERSION, upgradeDatabaseSchema } from "../web/storage-schema.js";

class Names {
  values = new Set<string>();
  contains(name: string) { return this.values.has(name); }
}
class Store {
  keyPath: string | string[];
  indexNames = new Names();
  indexes = new Map<string, { keyPath: string | string[]; unique: boolean }>();
  constructor(keyPath: string | string[]) { this.keyPath = keyPath; }
  index(name: string) { return this.indexes.get(name)!; }
  createIndex(name: string, keyPath: string | string[], options: { unique: boolean }) { this.indexNames.values.add(name); this.indexes.set(name, { keyPath, unique: options.unique }); }
  deleteIndex(name: string) { this.indexNames.values.delete(name); this.indexes.delete(name); }
}
function harness(existing: Record<string, Store> = {}) {
  const stores = new Map(Object.entries(existing));
  const objectStoreNames = new Names();
  for (const name of stores.keys()) objectStoreNames.values.add(name);
  const db = {
    objectStoreNames,
    createObjectStore(name: string, options: { keyPath: string | string[] }) { const store = new Store(options.keyPath); stores.set(name, store); objectStoreNames.values.add(name); return store; },
  };
  const transaction = { objectStore(name: string) { return stores.get(name)!; } };
  return { db, transaction, stores };
}

test("version 6 repairs missing and malformed indexes without recreating stores", () => {
  assert.equal(DB_VERSION, 6);
  const cases = new Store("id");
  const files = new Store("id");
  files.createIndex("caseId", "wrongCaseId", { unique: true });
  const state = harness({ cases, files });
  upgradeDatabaseSchema(state.db as never, state.transaction as never);
  assert.deepEqual([...state.stores.keys()].sort(), DATABASE_SCHEMA.map(({ name }) => name).sort());
  assert.equal(state.stores.get("cases"), cases);
  assert.equal(state.stores.get("files"), files);
  for (const definition of DATABASE_SCHEMA) {
    const store = state.stores.get(definition.name)!;
    for (const index of definition.indexes) assert.deepEqual(store.index(index.name), { keyPath: index.keyPath, unique: index.unique });
  }
});

test("refuses to replace an incompatible object store key path", () => {
  const state = harness({ cases: new Store("legacy-id") });
  assert.throws(() => upgradeDatabaseSchema(state.db as never, state.transaction as never), /Unsafe key path for cases/);
  assert.equal(state.stores.get("cases")?.keyPath, "legacy-id");
});
