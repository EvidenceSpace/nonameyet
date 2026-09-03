import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const interruptedMessage = "Processing was interrupted before this backup was restored. Process the source again.";

test("restored in-progress extraction becomes an explicit retryable failure", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return []; } } });
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1, height: 1, close() {} }) });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Interrupted restore recovery");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying safe recovery of interrupted extraction after restore.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({ name: "interrupted-source.png", mimeType: "image/png", buffer: imageBytes });
  await expect(page.locator(".file-row", { hasText: "interrupted-source.png" })).toBeVisible();
  await page.evaluate(async (message) => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const backup = await import("/case-backup.js");
    const [file] = await storage.getFilesForCase(caseId);
    const [recovered] = backup.recoverInterruptedProcessing([{ fileId: file.id, caseId, fileHash: file.sha256, status: "extracting", message: "Running OCR locally in this browser…", updatedAt: "2026-08-02T23:00:00.000Z", artifact: { text: "partial output that must be discarded" }, nextRetryAt: "2026-08-02T23:01:00.000Z" }], "2026-08-03T00:00:00.000Z");
    if (recovered.message !== message) throw new Error("Unexpected recovery message");
    await storage.saveProcessing(recovered);
  }, interruptedMessage);
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  const row = page.locator(".file-row", { hasText: "interrupted-source.png" });
  await expect(row).toBeVisible();
  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(interruptedMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".cancel-processing")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  const stored = await page.evaluate(async () => { const caseId = new URLSearchParams(location.search).get("id") as string; const storage = await import("/storage.js"); return (await storage.getProcessingForCase(caseId))[0]; });
  expect(stored.status).toBe("failed");
  expect(stored.failure).toEqual({ code: "interrupted", retryable: true });
  expect(stored.artifact).toBeUndefined();
  expect(stored.nextRetryAt).toBeUndefined();
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  const persisted = page.locator(".file-row", { hasText: "interrupted-source.png" });
  await expect(persisted).toBeVisible();
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(interruptedMessage);
  await expect(persisted.locator(".process-file")).toHaveText("Retry");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
