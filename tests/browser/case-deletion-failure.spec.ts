import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("an interrupted permanent deletion preserves the complete case bundle", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (failure) => pageErrors.push(failure.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Deletion failure rollback");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill(
    "A synthetic case verifying that interrupted permanent deletion preserves the complete local case bundle.",
  );
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({
    name: "invoice.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  await expect(page.locator(".file-row", { hasText: "invoice.png" })).toBeVisible();

  const identifiers = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    const sourceReference = {
      fileId: file.id,
      sha256: file.sha256,
      locator: { kind: "whole_file" },
    };
    await storage.saveFact({
      id: "fact_delete_rollback",
      caseId,
      type: "other",
      value: "Invoice total ₹5,000",
      sourceFileId: file.id,
      sourceReference,
      status: "confirmed",
      manuallyEntered: true,
    });
    await storage.saveSuggestion({
      id: "suggestion_delete_rollback",
      caseId,
      fileId: file.id,
      label: "Payment date",
      value: "3 August",
      sourceReference,
      status: "suggested",
    });
    await storage.saveProcessing({
      fileId: file.id,
      caseId,
      fileHash: file.sha256,
      status: "failed",
      failure: { code: "test", retryable: true },
    });
    const eventAt = "2026-08-14T08:03:00.000Z";
    const event = {
      id: "event_delete_rollback",
      caseId,
      eventDate: "2026-08-03",
      title: "Invoice received",
      description: "The selected source shows that the invoice was received.",
      sourceFileId: file.id,
      sourceReference,
      origin: "user_entered",
      revision: 1,
      createdAt: eventAt,
      updatedAt: eventAt,
    };
    await storage.saveEvent(event);
    return { caseId, event };
  });

  await page.goto("/cases.html");
  const card = page.locator(".local-case-card", { hasText: "Deletion failure rollback" });
  await expect(card).toBeVisible();
  await card.locator(".delete-case-trigger").click();
  const dialog = page.locator(".case-delete-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#delete-title-confirmation").fill("Deletion failure rollback");
  await dialog.locator("#delete-case-ack").check();
  await page.evaluate(() => {
    const remove = IDBObjectStore.prototype.delete;
    let injected = false;
    IDBObjectStore.prototype.delete = function (...args) {
      const request = remove.apply(this, args as [IDBValidKey]);
      if (!injected && this.name === "cases") {
        injected = true;
        this.transaction.abort();
      }
      return request;
    };
  });
  await dialog.locator("#confirm-case-delete").click();

  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#delete-case-error")).toHaveText(
    "The case could not be deleted. Nothing was changed.",
  );
  await expect(card).toBeVisible();
  const bundle = await page.evaluate(async ({ caseId }) => {
    const storage = await import("/storage.js");
    return {
      record: Boolean(await storage.getCase(caseId)),
      files: await storage.getFilesForCase(caseId),
      facts: await storage.getFactsForCase(caseId),
      suggestions: await storage.getSuggestionsForCase(caseId),
      processing: await storage.getProcessingForCase(caseId),
      events: await storage.getEventsForCase(caseId),
    };
  }, identifiers);
  expect({
    record: bundle.record,
    files: bundle.files.length,
    facts: bundle.facts.length,
    suggestions: bundle.suggestions.length,
    processing: bundle.processing.length,
    events: bundle.events.length,
  }).toEqual({ record: true, files: 1, facts: 1, suggestions: 1, processing: 1, events: 1 });
  expect(bundle.events[0]).toEqual(identifiers.event);
  expect(bundle.facts[0].sourceReference).toEqual(bundle.events[0].sourceReference);
  expect(bundle.suggestions[0].sourceReference).toEqual(bundle.events[0].sourceReference);

  await dialog.locator(".delete-cancel").click();
  await page.reload();
  await expect(page.locator(".local-case-card", { hasText: "Deletion failure rollback" })).toBeVisible();
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
