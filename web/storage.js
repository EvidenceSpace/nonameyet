const DB_NAME = "casefind-preview";
const DB_VERSION = 3;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("cases")) db.createObjectStore("cases", { keyPath: "id" });
      if (!db.objectStoreNames.contains("files")) {
        const files = db.createObjectStore("files", { keyPath: "id" });
        files.createIndex("caseId", "caseId", { unique: false });
        files.createIndex("caseHash", ["caseId", "sha256"], { unique: true });
      }
      if (!db.objectStoreNames.contains("facts")) {
        const facts = db.createObjectStore("facts", { keyPath: "id" });
        facts.createIndex("caseId", "caseId", { unique: false });
        facts.createIndex("sourceFileId", "sourceFileId", { unique: false });
      }
      if (!db.objectStoreNames.contains("suggestions")) {
        const suggestions = db.createObjectStore("suggestions", { keyPath: "id" });
        suggestions.createIndex("caseId", "caseId", { unique: false });
        suggestions.createIndex("fileId", "fileId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(storeName, mode, action) {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, mode);
    const result = await action(tx.objectStore(storeName));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
    });
    return result;
  } finally {
    db.close();
  }
}

export function saveCase(value) { return transaction("cases", "readwrite", (store) => requestResult(store.put(value))); }
export function getCase(id) { return transaction("cases", "readonly", (store) => requestResult(store.get(id))); }
export function saveFile(value) { return transaction("files", "readwrite", (store) => requestResult(store.add(value))); }
export function deleteFile(id) { return transaction("files", "readwrite", (store) => requestResult(store.delete(id))); }
export function getFilesForCase(caseId) { return transaction("files", "readonly", (store) => requestResult(store.index("caseId").getAll(caseId))); }
export function saveFact(value) { return transaction("facts", "readwrite", (store) => requestResult(store.put(value))); }
export function getFactsForCase(caseId) { return transaction("facts", "readonly", (store) => requestResult(store.index("caseId").getAll(caseId))); }
export function deleteFact(id) { return transaction("facts", "readwrite", (store) => requestResult(store.delete(id))); }
export function saveSuggestion(value) { return transaction("suggestions", "readwrite", (store) => requestResult(store.put(value))); }
export function getSuggestionsForCase(caseId) { return transaction("suggestions", "readonly", (store) => requestResult(store.index("caseId").getAll(caseId))); }
export function deleteSuggestion(id) { return transaction("suggestions", "readwrite", (store) => requestResult(store.delete(id))); }

export async function deleteCase(caseId) {
  const [files, facts, suggestions] = await Promise.all([
    getFilesForCase(caseId),
    getFactsForCase(caseId),
    getSuggestionsForCase(caseId),
  ]);
  await transaction("files", "readwrite", async (store) => { for (const file of files) store.delete(file.id); });
  await transaction("facts", "readwrite", async (store) => { for (const fact of facts) store.delete(fact.id); });
  await transaction("suggestions", "readwrite", async (store) => { for (const suggestion of suggestions) store.delete(suggestion.id); });
  await transaction("cases", "readwrite", (store) => requestResult(store.delete(caseId)));
}

export async function sha256(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createId(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
