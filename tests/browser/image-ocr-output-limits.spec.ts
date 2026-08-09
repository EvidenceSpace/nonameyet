import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("fails closed when local OCR returns excessive text blocks", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1000, height: 700, close() {} }) });
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return Array.from({ length: 10_001 }, (_, index) => ({ rawValue: "x", boundingBox: { x: 1, y: index } })); } } });
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Bound OCR output"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("Keep excessive OCR output out of local storage.");
  await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({ name: "dense.png", mimeType: "image/png", buffer: imageBytes });
  const row = page.locator(".file-row", { hasText: "dense.png" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Stored locally");
  const process = row.locator(".process-file");
  await expect(process).toBeEnabled();
  await process.click();
  await expect(row.locator(".processing-status")).toHaveText("Needs attention"); await expect(row.locator(".process-file")).toHaveCount(0); await expect(row.locator(".view-extracted-text")).toHaveCount(0); await expect(row.locator(".analyze-record")).toHaveCount(0);
  const stored = await page.evaluate(async () => { const caseId = new URLSearchParams(location.search).get("id") as string; const storage = await import("/storage.js"); return (await storage.getProcessingForCase(caseId))[0]; });
  expect(stored.failure).toEqual({ code: "output_too_large", retryable: false }); expect(stored.artifact).toBeUndefined();
});
