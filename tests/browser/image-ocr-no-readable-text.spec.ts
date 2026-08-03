import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const emptyTextMessage = "No readable text was found in this image. The original remains stored locally; review it manually or add a clearer image explicitly.";

test("marks empty local OCR output as permanent without an artifact", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1200, height: 800, close() {} }) });
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return [{ rawValue: "  ", boundingBox: { x: 1, y: 1 } }]; } } });
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("No readable OCR text"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("Verify empty OCR output cannot become evidence.");
  await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "unreadable-message.png", mimeType: "image/png", buffer: imageBytes });
  const row = page.locator(".file-row", { hasText: "unreadable-message.png" });
  await row.locator(".process-file").click();
  await expect(row.locator(".processing-status")).toHaveText("Needs attention"); await expect(row.locator(".processing-note")).toHaveText(emptyTextMessage); await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0); await expect(row.locator(".analyze-record")).toHaveCount(0); await expect(page.locator(".fact-record")).toHaveCount(0);
  const stored = await page.evaluate(async () => { const caseId = new URLSearchParams(location.search).get("id") as string; const storage = await import("/storage.js"); return (await storage.getProcessingForCase(caseId))[0]; });
  expect(stored.failure).toEqual({ code: "empty_text", retryable: false }); expect(stored.artifact).toBeUndefined();
  await page.reload(); const persisted = page.locator(".file-row", { hasText: "unreadable-message.png" }); await expect(persisted.locator(".processing-status")).toHaveText("Needs attention"); await expect(persisted.locator(".process-file")).toHaveCount(0);
});
