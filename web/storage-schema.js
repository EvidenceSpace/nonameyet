export const DB_NAME = "casefind-preview";
export const DB_VERSION = 6;

export const DATABASE_SCHEMA = [
  { name: "cases", keyPath: "id", indexes: [] },
  { name: "files", keyPath: "id", indexes: [
    { name: "caseId", keyPath: "caseId", unique: false },
    { name: "caseHash", keyPath: ["caseId", "sha256"], unique: true },
  ] },
  { name: "facts", keyPath: "id", indexes: [
    { name: "caseId", keyPath: "caseId", unique: false },
    { name: "sourceFileId", keyPath: "sourceFileId", unique: false },
  ] },
  { name: "suggestions", keyPath: "id", indexes: [
    { name: "caseId", keyPath: "caseId", unique: false },
    { name: "fileId", keyPath: "fileId", unique: false },
  ] },
  { name: "processing", keyPath: "fileId", indexes: [
    { name: "caseId", keyPath: "caseId", unique: false },
  ] },
  { name: "events", keyPath: "id", indexes: [
    { name: "caseId", keyPath: "caseId", unique: false },
    { name: "sourceFileId", keyPath: "sourceFileId", unique: false },
  ] },
];

function sameKeyPath(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function upgradeDatabaseSchema(db, upgradeTransaction) {
  for (const definition of DATABASE_SCHEMA) {
    const store = db.objectStoreNames.contains(definition.name)
      ? upgradeTransaction.objectStore(definition.name)
      : db.createObjectStore(definition.name, { keyPath: definition.keyPath });
    if (!sameKeyPath(store.keyPath, definition.keyPath)) {
      throw new Error(`Unsafe key path for ${definition.name}.`);
    }
    for (const indexDefinition of definition.indexes) {
      if (store.indexNames.contains(indexDefinition.name)) {
        const existing = store.index(indexDefinition.name);
        if (sameKeyPath(existing.keyPath, indexDefinition.keyPath) && existing.unique === indexDefinition.unique) continue;
        store.deleteIndex(indexDefinition.name);
      }
      store.createIndex(indexDefinition.name, indexDefinition.keyPath, { unique: indexDefinition.unique });
    }
  }
}
