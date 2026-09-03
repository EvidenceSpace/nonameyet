import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const failureMessage = "The correction could not be saved on this device. Nothing was changed. Try again.";

test("an interrupted correction preserves the suggestion without creating a fact", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Atomic suggestion correction");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that interrupted correction never creates partial review state.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "invoice.png", mimeType: "image/png", buffer: imageBytes });
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator(".file-row", { hasText: "invoice.png" })).toHaveCount(1);
  const before = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveSuggestion({
      id: "suggestion_atomic_correction", caseId, fileId: file.id, label: "Invoice total",
      value: "₹5,000", confidence: 0.91, status: "suggested", aiSuggested: true,
      decidedByUser: false,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "quote", quote: "Invoice total ₹5,000" } },
      createdAt: "2026-08-03T00:00:00.000Z",
    });
    return { updatedAt: (await storage.getCase(caseId)).updatedAt };
  });
  await page.reload();
  const card = page.locator('.suggestion-card[data-id="suggestion_atomic_correction"]');
  await expect(card).toHaveCount(1);
  await card.locator(".correct-suggestion").click();
  const dialog = page.locator("#correction-dialog");
  await expect(dialog).toBeVisible();
  await page.locator("#correction-value").fill("₹4,750");
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (...args) {
      const request = originalPut.apply(this, args as [unknown]);
      if (!injected && this.name === "cases" && this.transaction.objectStoreNames.contains("facts") && this.transaction.objectStoreNames.contains("suggestions")) {
        injected = true;
        this.transaction.abort();
      }
      return request;
    };
  });
  await page.locator("#correction-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator("#correction-review-status")).toBeVisible();
  await expect(page.locator("#correction-review-status")).toHaveText(failureMessage);
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toHaveAttribute("aria-busy", "true");
  await expect(page.locator('#correction-form button[type="submit"]')).toBeEnabled();
  await expect(page.locator("#correction-value")).toHaveValue("₹4,750");
  await expect(card).toHaveCount(1);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      facts: await storage.getFactsForCase(caseId),
      suggestions: await storage.getSuggestionsForCase(caseId),
      updatedAt: (await storage.getCase(caseId)).updatedAt,
    };
  });
  expect(stored.facts).toEqual([]);
  expect(stored.suggestions.map((item: { id: string; value: string }) => [item.id, item.value])).toEqual([["suggestion_atomic_correction", "₹5,000"]]);
  expect(stored.updatedAt).toBe(before.updatedAt);
  await page.locator("#cancel-correction").click();
  await page.reload();
  await expect(page.locator('.suggestion-card[data-id="suggestion_atomic_correction"]')).toHaveCount(1);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
