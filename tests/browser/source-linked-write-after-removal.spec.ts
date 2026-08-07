import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("deleted sources cannot be recreated as orphaned linked records", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Source-linked write guard");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying deleted sources cannot acquire new derivatives.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({
    name: "source.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  await expect(page.locator(".file-row")).toHaveCount(1);

  const result = await page.evaluate(async () => {
    const storage = await import("/storage.js");
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const [file] = await storage.getFilesForCase(caseId);
    const sourceReference = {
      fileId: file.id,
      sha256: file.sha256,
      locator: { kind: "whole_file" },
    };
    const attempts = [
      ["fact", () => storage.saveFact({
        id: "fact-after-delete", caseId, sourceFileId: file.id, sourceReference,
        value: "Invoice total", status: "confirmed", manuallyEntered: true,
      })],
      ["suggestion", () => storage.saveSuggestion({
        id: "suggestion-after-delete", caseId, fileId: file.id, sourceReference,
        label: "Invoice total", value: "5000", status: "suggested",
        aiSuggested: true, decidedByUser: false,
      })],
      ["processing", () => storage.saveProcessing({
        fileId: file.id, caseId, fileHash: file.sha256, status: "extracting",
      })],
      ["event", () => storage.saveEvent({
        id: "event-after-delete", caseId, sourceFileId: file.id, sourceReference,
        eventDate: "2026-08-07", title: "Files delivered",
      })],
    ] as const;

    await storage.deleteFile(file);
    const updatedAtAfterRemoval = (await storage.getCase(caseId)).updatedAt;
    const errors: Record<string, { name?: string; code?: string }> = {};
    for (const [name, operation] of attempts) {
      try { await operation(); }
      catch (error: any) { errors[name] = { name: error?.name, code: error?.code }; }
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
  });

  expect(result.errors).toEqual({
    fact: { name: "SourceLinkedWriteError", code: "source_missing" },
    suggestion: { name: "SourceLinkedWriteError", code: "source_missing" },
    processing: { name: "SourceLinkedWriteError", code: "source_missing" },
    event: { name: "SourceLinkedWriteError", code: "source_missing" },
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
