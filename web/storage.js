const DB_NAME = "casefind-preview";
const DB_VERSION = 5;

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
        const store = db.createObjectStore("files", { keyPath: "id" });
        store.createIndex("caseId", "caseId", { unique: false });
        store.createIndex("caseHash", ["caseId", "sha256"], { unique: true });
      }
      if (!db.objectStoreNames.contains("facts")) {
        const store = db.createObjectStore("facts", { keyPath: "id" });
        store.createIndex("caseId", "caseId", { unique: false });
        store.createIndex("sourceFileId", "sourceFileId", { unique: false });
      }
      if (!db.objectStoreNames.contains("suggestions")) {
        const store = db.createObjectStore("suggestions", { keyPath: "id" });
        store.createIndex("caseId", "caseId", { unique: false });
        store.createIndex("fileId", "fileId", { unique: false });
      }
      if (!db.objectStoreNames.contains("processing")) {
        const store = db.createObjectStore("processing", { keyPath: "fileId" });
        store.createIndex("caseId", "caseId", { unique: false });
      }
      if (!db.objectStoreNames.contains("events")) {
        const store = db.createObjectStore("events", { keyPath: "id" });
        store.createIndex("caseId", "caseId", { unique: false });
        store.createIndex("sourceFileId", "sourceFileId", { unique: false });
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
  } finally { db.close(); }
}

export const saveCase = (value) => transaction("cases", "readwrite", (store) => requestResult(store.put(value)));
export const getCase = (id) => transaction("cases", "readonly", (store) => requestResult(store.get(id)));
export const getAllCases = () => transaction("cases", "readonly", (store) => requestResult(store.getAll()));

async function touchCase(caseId, at = new Date().toISOString()) {
  if (!caseId) return;
  const record = await getCase(caseId);
  if (record) await saveCase({ ...record, updatedAt: at });
}
async function saveWithActivity(storeName, value, method) {
  const result = await transaction(storeName, "readwrite", (store) => requestResult(store[method](value)));
  await touchCase(value.caseId);
  return result;
}
async function deleteWithActivity(storeName, id) {
  const value = await transaction(storeName, "readonly", (store) => requestResult(store.get(id)));
  await transaction(storeName, "readwrite", (store) => requestResult(store.delete(id)));
  await touchCase(value?.caseId);
}
export const saveFile = (value) => saveWithActivity("files", value, "add");
export async function deleteFile(id) { await deleteProcessing(id); return deleteWithActivity("files", id); }
export const getFilesForCase = (id) => transaction("files", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const saveFact = (value) => saveWithActivity("facts", value, "put");
export const getFactsForCase = (id) => transaction("facts", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteFact = (id) => deleteWithActivity("facts", id);
export const saveSuggestion = (value) => saveWithActivity("suggestions", value, "put");
export const getSuggestionsForCase = (id) => transaction("suggestions", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteSuggestion = (id) => deleteWithActivity("suggestions", id);
export const saveProcessing = (value) => saveWithActivity("processing", value, "put");
export const getProcessingForCase = (id) => transaction("processing", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteProcessing = (id) => deleteWithActivity("processing", id);
export const saveEvent = (value) => saveWithActivity("events", value, "put");
export const getEventsForCase = (id) => transaction("events", "readonly", (store) => requestResult(store.index("caseId").getAll(id)));
export const deleteEvent = (id) => deleteWithActivity("events", id);
export async function markCaseBackedUp(caseId, at = new Date().toISOString()) {
  const record = await getCase(caseId);
  if (!record) throw new Error("Case not found.");
  await saveCase({ ...record, lastBackupAt: at });
}
export async function setCaseArchived(caseId, archived, at = new Date().toISOString()) {
  const record = await getCase(caseId);
  if (!record) throw new Error("Case not found.");
  const updated = { ...record, updatedAt: at };
  if (archived) updated.archivedAt = at;
  else delete updated.archivedAt;
  await saveCase(updated);
  return updated;
}

export async function deleteCase(caseId) {
  const db = await openDatabase();
  try {
    const names = ["cases", "files", "facts", "suggestions", "processing", "events"];
    const tx = db.transaction(names, "readwrite");
    const range = IDBKeyRange.only(caseId);
    for (const storeName of names.slice(1)) {
      const request = tx.objectStore(storeName).index("caseId").openCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) { cursor.delete(); cursor.continue(); }
      };
    }
    tx.objectStore("cases").delete(caseId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(new Error("The case could not be deleted. Nothing was changed."));
      tx.onabort = () => reject(new Error("The case could not be deleted. Nothing was changed."));
    });
  } finally { db.close(); }
}

export async function restoreCaseBundle(bundle) {
  const existing = await getCase(bundle.record.id);
  if (existing) throw new Error("This case already exists on this device. Nothing was overwritten.");
  const db = await openDatabase();
  try {
    const tx = db.transaction(["cases", "files", "facts", "suggestions", "processing", "events"], "readwrite");
    tx.objectStore("cases").add(bundle.record);
    for (const file of bundle.files) tx.objectStore("files").add(file);
    for (const fact of bundle.facts) tx.objectStore("facts").add(fact);
    for (const suggestion of bundle.suggestions) tx.objectStore("suggestions").add(suggestion);
    for (const job of bundle.processing) tx.objectStore("processing").add(job);
    for (const event of bundle.events || []) tx.objectStore("events").add(event);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(new Error("The backup collided with existing local data. Nothing was restored."));
      tx.onabort = () => reject(new Error("The backup could not be restored. Nothing was changed."));
    });
    return bundle.record.id;
  } finally { db.close(); }
}

export async function sha256(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
export const createId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

if (location.pathname.endsWith("/case.html")) {
  import("./processing-ui.js");
  import("./report-ui.js");
  import("./backup-ui.js");
  import("./library-link.js");
  import("./case-details-ui.js");
  import("./workspace-delete-ui.js");
  import("./timeline-ui.js");
  import("./consistency-ui.js");
  import("./readiness-ui.js");
}
