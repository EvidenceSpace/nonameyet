import { expect, test } from "playwright/test";

test("upgrades a partial version 5 database without deleting local records", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase("casefind-preview"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("casefind-preview", 5);
      request.onupgradeneeded = () => {
        const db = request.result;
        const cases = db.createObjectStore("cases", { keyPath: "id" });
        cases.add({ id: "case-legacy", title: "Preserved legacy case", updatedAt: "2026-01-01T00:00:00.000Z" });
        const files = db.createObjectStore("files", { keyPath: "id" });
        files.createIndex("caseId", "caseId", { unique: false });
        files.add({ id: "file-legacy", caseId: "case-legacy", sha256: "a".repeat(64), name: "legacy.pdf" });
        const facts = db.createObjectStore("facts", { keyPath: "id" });
        facts.add({ id: "fact-legacy", caseId: "case-legacy", sourceFileId: "file-legacy", value: "Preserved fact" });
        const suggestions = db.createObjectStore("suggestions", { keyPath: "id" });
        suggestions.createIndex("caseId", "caseId", { unique: false });
        const processing = db.createObjectStore("processing", { keyPath: "fileId" });
        const events = db.createObjectStore("events", { keyPath: "id" });
        events.createIndex("caseId", "caseId", { unique: false });
      };
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    });
  });

  const result = await page.evaluate(async () => {
    const storage = await import(`/storage.js?migration=${Date.now()}`);
    const [cases, files, facts] = await Promise.all([storage.getAllCases(), storage.getFilesForCase("case-legacy"), storage.getFactsForCase("case-legacy")]);
    const db = await storage.openDatabase();
    const indexes: Record<string, string[]> = {};
    for (const name of ["files", "facts", "suggestions", "processing", "events"]) indexes[name] = [...db.transaction(name, "readonly").objectStore(name).indexNames];
    const version = db.version;
    db.close();
    return { version, cases, files, facts, indexes };
  });

  expect(result.version).toBe(6);
  expect(result.cases).toEqual([{ id: "case-legacy", title: "Preserved legacy case", updatedAt: "2026-01-01T00:00:00.000Z" }]);
  expect(result.files).toHaveLength(1);
  expect(result.facts).toHaveLength(1);
  expect(result.indexes.files.sort()).toEqual(["caseHash", "caseId"]);
  expect(result.indexes.facts.sort()).toEqual(["caseId", "sourceFileId"]);
  expect(result.indexes.suggestions.sort()).toEqual(["caseId", "fileId"]);
  expect(result.indexes.processing).toEqual(["caseId"]);
  expect(result.indexes.events.sort()).toEqual(["caseId", "sourceFileId"]);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("fails promptly when another tab blocks a required storage upgrade", async ({ page }) => {
  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase("casefind-preview"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
    const blocker = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("casefind-preview", 5); request.onupgradeneeded = () => request.result.createObjectStore("cases", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    Object.defineProperty(globalThis, "__casefindUpgradeBlocker", { configurable: true, value: blocker });
  });
  const error = await page.evaluate(async () => {
    const storage = await import(`/storage.js?blocked=${Date.now()}`);
    try { await storage.openDatabase(); return null; }
    catch (caught) { return { name: caught.name, code: caught.code, message: caught.message }; }
  });
  expect(error).toEqual({ name: "StorageOpenError", code: "upgrade_blocked", message: "Local storage needs an upgrade, but another CaseFind tab is still using it. Close other CaseFind tabs and try again." });
  await page.evaluate(() => (globalThis as typeof globalThis & { __casefindUpgradeBlocker: IDBDatabase }).__casefindUpgradeBlocker.close());
});
