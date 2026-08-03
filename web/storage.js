import { DB_NAME, DB_VERSION, upgradeDatabaseSchema } from "./storage-schema.js";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class StorageOpenError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "StorageOpenError";
    this.code = code;
    this.cause = cause;
  }
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    request.onupgradeneeded = () => {
      try {
        upgradeDatabaseSchema(request.result, request.transaction);
      } catch {
        request.transaction?.abort();
      }
    };
    request.onblocked = () => rejectOnce(new StorageOpenError(
      "upgrade_blocked",
      "Local storage needs an upgrade, but another CaseFind tab is still using it. Close other CaseFind tabs and try again.",
    ));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (settled) { db.close(); return; }
      settled = true;
      resolve(db);
    };
    request.onerror = () => rejectOnce(new StorageOpenError(
      "open_failed",
      "Local storage could not be opened safely. Nothing was changed.",
      request.error,
    ));
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

async function saveWithActivity(storeName, value, method) {
  const db = await openDatabase();
  try {
    const tx = db.transaction([storeName, "cases"], "readwrite");
    const resultRequest = tx.objectStore(storeName)[method](value);
    if (value.caseId) {
      const cases = tx.objectStore("cases");
      const caseRequest = cases.get(value.caseId);
      caseRequest.onsuccess = () => {
        if (caseRequest.result) cases.put({ ...caseRequest.result, updatedAt: new Date().toISOString() });
      };
    }
    return await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(resultRequest.result);
      tx.onabort = () => reject(tx.error || resultRequest.error || new Error("Transaction aborted"));
    });
  } finally { db.close(); }
}
async function deleteWithActivity(storeName, id, relatedStoreNames = []) {
  const db = await openDatabase();
  try {
    const tx = db.transaction([storeName, ...relatedStoreNames, "cases"], "readwrite");
    const store = tx.objectStore(storeName);
    const valueRequest = store.get(id);
    valueRequest.onsuccess = () => {
      const value = valueRequest.result;
      store.delete(id);
      for (const relatedStoreName of relatedStoreNames) tx.objectStore(relatedStoreName).delete(id);
      if (value?.caseId) {
        const cases = tx.objectStore("cases");
        const caseRequest = cases.get(value.caseId);
        caseRequest.onsuccess = () => {
          if (caseRequest.result) cases.put({ ...caseRequest.result, updatedAt: new Date().toISOString() });
        };
      }
    };
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error || valueRequest.error || new Error("Transaction aborted"));
    });
  } finally { db.close(); }
}
export const saveFile = (value) => saveWithActivity("files", value, "add");
export const deleteFile = (id) => deleteWithActivity("files", id, ["processing"]);
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

if (location.pathname.endsWith("/case.html")) import("./workspace-bootstrap.js");
