import { expect, test } from "playwright/test";

const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const mismatchMessage = "This image appears damaged or does not match its declared format. CaseFind did not run OCR. The original remains stored locally; verify the file and add a valid PNG, JPEG, or WebP copy explicitly.";

test("fails permanently when image bytes do not match the declared media type", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1, height: 1, close() {} }) });
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return []; } } });
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Image media integrity"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("Verify mismatched image bytes fail closed.");
  await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click(); await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({ name: "mislabeled-message.jpg", mimeType: "image/jpeg", buffer: pngBytes });
  const row = page.locator(".file-row", { hasText: "mislabeled-message.jpg" });
  await expect(row).toBeVisible();
  await expect(row.locator(".process-file")).toBeEnabled();
  await row.locator(".process-file").click();
  await expect(row.locator(".processing-status")).toHaveText("Needs attention");
  await expect(row.locator(".processing-note")).toHaveText(mismatchMessage);
  await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0); await expect(row.locator(".analyze-record")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  const persisted = page.locator(".file-row", { hasText: "mislabeled-message.jpg" });
  await expect(persisted).toBeVisible();
  await expect(persisted.locator(".processing-status")).toHaveText("Needs attention"); await expect(persisted.locator(".process-file")).toHaveCount(0);
  expect(externalRequests).toEqual([]); expect(pageErrors).toEqual([]);
});
