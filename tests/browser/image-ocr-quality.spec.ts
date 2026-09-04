import { expect, test } from "playwright/test";
import { seedWorkspaceFiles } from "./workspace-file-fixture";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const warning = "OCR confidence is moderate. Verify names, dates, reference numbers, and amounts against the original image.";

test("persists and displays review-oriented OCR confidence", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1000, height: 700, close() {} }) });
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return [
      { rawValue: "Invoice 1042", confidence: .8, boundingBox: { x: 1, y: 1 } },
      { rawValue: "Balance 5,000", confidence: .76, boundingBox: { x: 1, y: 2 } },
    ]; } } });
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("OCR confidence review"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("Verify confidence stays review-oriented.");
  await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [{ id: "file_ocr_quality", name: "confidence.png", mimeType: "image/png", buffer: imageBytes }]);
  const row = page.locator(".file-row", { hasText: "confidence.png" });
  await expect(row.locator(".process-file")).toBeEnabled({ timeout: 30_000 });
  await row.locator(".process-file").click();
  await expect(row.locator(".processing-status")).toHaveText("Text ready"); await row.locator(".view-extracted-text").click();
  await expect(page.locator("#text-source-quality")).toHaveText("OCR confidence 78% · medium");
  await expect(page.locator("#text-source-warnings")).toHaveText(warning);
  const quality = await page.evaluate(async () => { const caseId = new URLSearchParams(location.search).get("id") as string; const storage = await import("/storage.js"); return (await storage.getProcessingForCase(caseId))[0].artifact.quality; });
  expect(quality).toEqual({ confidence: .78, level: "medium", reviewRequired: true, warning });
});
