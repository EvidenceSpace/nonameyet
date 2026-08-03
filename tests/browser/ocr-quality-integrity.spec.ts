import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("fails closed when stored OCR quality becomes inconsistent", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 100, height: 100, close() {} }) });
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return [{ rawValue: "Invoice 1042", confidence: .95, boundingBox: { x: 1, y: 1 } }]; } } });
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Quality integrity"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("Reject misleading confidence metadata.");
  await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "integrity.png", mimeType: "image/png", buffer: imageBytes });
  const row = page.locator(".file-row", { hasText: "integrity.png" }); await row.locator(".process-file").click(); await expect(row.locator(".processing-status")).toHaveText("Text ready");
  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const job = (await storage.getProcessingForCase(caseId))[0];
    await storage.saveProcessing({ ...job, artifact: { ...job.artifact, quality: { confidence: .2, level: "high", reviewRequired: false, warning: null } } });
  });
  await page.reload();
  const restored = page.locator(".file-row", { hasText: "integrity.png" });
  await expect(restored.locator(".processing-status")).toHaveText("Failed");
  await expect(restored.locator(".processing-note")).toHaveText("Stored extraction is invalid. Process the source again.");
  await expect(restored.locator(".view-extracted-text")).toHaveCount(0); await expect(restored.locator(".analyze-record")).toHaveCount(0);
});
