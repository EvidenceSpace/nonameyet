import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const failureMessage = "The suggestion could not be dismissed on this device. Nothing was changed. Try again.";

test("an interrupted dismissal preserves the pending suggestion", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Atomic suggestion dismissal");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that interrupted dismissal never hides a pending review item.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [{ id: "file_suggestion_dismissal", name: "invoice.png", mimeType: "image/png", buffer: imageBytes }]);
  const before = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveSuggestion({
      id: "suggestion_atomic_dismissal", caseId, fileId: file.id, label: "Invoice total",
      value: "₹5,000", confidence: 0.91, status: "suggested", aiSuggested: true,
      decidedByUser: false,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "quote", quote: "Invoice total ₹5,000" } },
      createdAt: "2026-08-03T00:00:00.000Z",
    });
    return { updatedAt: (await storage.getCase(caseId)).updatedAt };
  });
  await page.reload();
  await waitForWorkspace(page);
  const card = page.locator('.suggestion-card[data-id="suggestion_atomic_dismissal"]');
  await expect(card).toHaveCount(1);
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (...args) {
      const request = originalPut.apply(this, args as [unknown]);
      if (!injected && this.name === "cases" && this.transaction.objectStoreNames.contains("suggestions")) {
        injected = true;
        this.transaction.abort();
      }
      return request;
    };
  });
  const dismissButton = card.locator(".dismiss-suggestion");
  await dismissButton.click();
  await expect(page.locator("#review-decision-status")).toBeVisible();
  await expect(page.locator("#review-decision-status")).toHaveText(failureMessage);
  await expect(card).not.toHaveAttribute("aria-busy", "true");
  await expect(dismissButton).toBeEnabled();
  await expect(card).toHaveCount(1);
  await expect(page.locator("#nav-review-count")).toHaveText("1");
  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      suggestions: await storage.getSuggestionsForCase(caseId),
      updatedAt: (await storage.getCase(caseId)).updatedAt,
    };
  });
  expect(stored.suggestions.map((item: { id: string; status: string }) => [item.id, item.status])).toEqual([["suggestion_atomic_dismissal", "suggested"]]);
  expect(stored.updatedAt).toBe(before.updatedAt);
  await page.reload();
  await waitForWorkspace(page);
  await expect(page.locator('.suggestion-card[data-id="suggestion_atomic_dismissal"]')).toHaveCount(1);
  await expect(page.locator("#nav-review-count")).toHaveText("1");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
