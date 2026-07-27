const DB_NAME = "casefind-preview";
const DB_VERSION = 1;
function requestResult(request) { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export function openDatabase() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, DB_VERSION); request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains("cases")) db.createObjectStore("cases", { keyPath: "id" }); if (!db.objectStoreNames.contains("files")) { const files = db.createObjectStore("files", { keyPath: "id" }); files.createIndex("caseId", "caseId", { unique: false }); files.createIndex("caseHash", ["caseId", "sha256"], { unique: true }); } }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function transaction(storeName, mode, action) { const db = await openDatabase(); try { const tx = db.transaction(storeName, mode); const result = await action(tx.objectStore(storeName)); await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error("Transaction aborted")); }); return result; } finally { db.close(); } }
export function saveCase(caseRecord) { return transaction("cases", "readwrite", (store) => requestResult(store.put(caseRecord))); }
export function getCase(id) { return transaction("cases", "readonly", (store) => requestResult(store.get(id))); }
export function saveFile(fileRecord) { return transaction("files", "readwrite", (store) => requestResult(store.add(fileRecord))); }
export function deleteFile(id) { return transaction("files", "readwrite", (store) => requestResult(store.delete(id))); }
export function getFilesForCase(caseId) { return transaction("files", "readonly", (store) => requestResult(store.index("caseId").getAll(caseId))); }
export async function deleteCase(caseId) { const files = await getFilesForCase(caseId); await transaction("files", "readwrite", async (store) => { for (const file of files) store.delete(file.id); }); await transaction("cases", "readwrite", (store) => requestResult(store.delete(caseId))); }
export async function sha256(file) { const bytes = await file.arrayBuffer(); const digest = await crypto.subtle.digest("SHA-256", bytes); return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
export function createId(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
