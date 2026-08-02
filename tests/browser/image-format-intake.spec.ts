import { expect, test } from "playwright/test";

const webpBytes = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x05, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x01,
]);
const heicBytes = Buffer.from("synthetic unsupported heic record");

test("accepts processable WebP and rejects unsupported HEIC before persistence", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: async () => ({ width: 1200, height: 800, close() {} }),
    });
    class DeterministicTextDetector {
      async detect() {
        return [{ rawValue: "Invoice total 5,000", boundingBox: { x: 10, y: 10 } }];
      }
    }
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: DeterministicTextDetector });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Image format intake boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that intake matches local image processing support.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  const input = page.locator("#file-input");
  await expect(input).toHaveAttribute("accept", "image/png,image/jpeg,image/webp,application/pdf");
  await input.setInputFiles({ name: "camera-record.heic", mimeType: "image/heic", buffer: heicBytes });
  await expect(page.locator("#upload-message")).toHaveClass(/error/);
  await expect(page.locator("#upload-message")).toHaveText("camera-record.heic was skipped: unsupported type.");
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("0");

  await input.setInputFiles({ name: "invoice-message.webp", mimeType: "image/webp", buffer: webpBytes });
  const row = page.locator(".file-row", { hasText: "invoice-message.webp" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".processing-status")).toHaveText("Not processed");
  await expect(row.locator(".process-file")).toHaveText("Run local OCR");
  await row.locator(".process-file").click();
  await expect(row.locator(".processing-status")).toHaveText("Text ready");
  await expect(row.locator(".processing-note")).toHaveText("Local OCR text is ready for review.");
  await expect(row.locator(".analyze-record")).toHaveText("Find details");
  await expect(page.locator(".fact-record")).toHaveCount(0);

  await row.locator(".view-extracted-text").click();
  await expect(page.locator("#text-source-content")).toHaveText("Invoice total 5,000");
  await expect(page.locator("#text-source-hash")).toHaveText(/^SHA-256 [a-f0-9]{64}$/);
  await page.locator("#close-text-source").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "invoice-message.webp" });
  await expect(persisted.locator(".processing-status")).toHaveText("Text ready");
  await expect(page.locator(".file-row", { hasText: "camera-record.heic" })).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("1");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
