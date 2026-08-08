import { expect, test } from "playwright/test";

const hash = "a".repeat(64);

async function resetStorage(page: import("playwright/test").Page) {
  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("casefind-preview");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database deletion blocked"));
    });
  });
}

test("deleted sources cannot be recreated as orphaned linked records", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (failure) => pageErrors.push(failure.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });
  await resetStorage(page);

  const result = await page.evaluate(async ({ sourceHash }) => {
    const storage = await import("/storage.js");
    const caseId = "case-source-removal";
    await storage.saveCase({ id: caseId, title: "Source guard", updatedAt: "2026-08-07T00:00:00.000Z" });
    const original = new File([new Uint8Array([137, 80, 78, 71])], "source.png", {
      type: "image/png",
      lastModified: 1_700_000_000_000,
    });
    const file = {
      id: "file-source-removal", caseId, name: original.name, type: original.type,
      size: original.size, sha256: sourceHash, createdAt: "2026-08-07T00:00:00.000Z", original,
    };
    await storage.saveFile(file, { now: () => "2026-08-07T00:05:00.000Z" });
    const sourceReference = { fileId: file.id, sha256: file.sha256, locator: { kind: "whole_file" } };
    const attempts = [
      ["fact", () => storage.saveFact({ id: "fact-after-delete", caseId, sourceFileId: file.id, sourceReference, value: "Invoice total", status: "confirmed", manuallyEntered: true })],
      ["suggestion", () => storage.saveSuggestion({ id: "suggestion-after-delete", caseId, fileId: file.id, sourceReference, label: "Invoice total", value: "5000", status: "suggested", aiSuggested: true, decidedByUser: false })],
      ["processing", () => storage.saveProcessing({ fileId: file.id, caseId, fileHash: file.sha256, status: "extracting" })],
      ["event", () => storage.saveEvent({
        id: "event-after-delete", caseId, eventDate: "2026-08-07", title: "Files delivered", description: "",
        sourceFileId: file.id, sourceReference, origin: "user_entered", revision: 1,
        createdAt: "2026-08-07T00:10:00.000Z", updatedAt: "2026-08-07T00:10:00.000Z",
      })],
    ] as const;

    await storage.deleteFile(file, { now: () => "2026-08-07T00:15:00.000Z" });
    const updatedAtAfterRemoval = (await storage.getCase(caseId)).updatedAt;
    const errors: Record<string, { name?: string; code?: string }> = {};
    for (const [name, operation] of attempts) {
      try { await operation(); }
      catch (failure: any) { errors[name] = { name: failure?.name, code: failure?.code }; }
    }
    return {
      errors,
      files: await storage.getFilesForCase(caseId),
      facts: await storage.getFactsForCase(caseId),
      suggestions: await storage.getSuggestionsForCase(caseId),
      processing: await storage.getProcessingForCase(caseId),
      events: await storage.getEventsForCase(caseId),
      updatedAtAfterRemoval,
      finalUpdatedAt: (await storage.getCase(caseId)).updatedAt,
    };
  }, { sourceHash: hash });

  expect(result.errors).toEqual({
    fact: { name: "SourceLinkedWriteError", code: "source_missing" },
    suggestion: { name: "SourceLinkedWriteError", code: "source_missing" },
    processing: { name: "SourceLinkedWriteError", code: "source_missing" },
    event: { name: "EventTransitionError", code: "source_missing" },
  });
  expect(result.files).toEqual([]);
  expect(result.facts).toEqual([]);
  expect(result.suggestions).toEqual([]);
  expect(result.processing).toEqual([]);
  expect(result.events).toEqual([]);
  expect(result.finalUpdatedAt).toBe(result.updatedAtAfterRemoval);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
