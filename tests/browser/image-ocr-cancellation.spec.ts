import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const cancelledMessage = "Local OCR was cancelled.";

test("cancels local image OCR without creating downstream evidence", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: async () => ({ width: 1, height: 1, close() {} }),
    });
    class DelayedTextDetector {
      async detect() {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return [{ rawValue: "This text must not be accepted after cancellation.", boundingBox: { x: 0, y: 0 } }];
      }
    }
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: DelayedTextDetector });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("OCR cancellation boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that cancelled local OCR creates no derived evidence.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "message-to-cancel.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  const row = page.locator(".file-row", { hasText: "message-to-cancel.png" });
  await row.locator(".process-file").click();
  await expect(row.locator(".processing-status")).toHaveText("Processing…");
  await expect(row.locator(".cancel-processing")).toHaveText("Cancel");
  await row.locator(".cancel-processing").click();

  await expect(row.locator(".processing-status")).toHaveText("Cancelled");
  await expect(row.locator(".processing-note")).toHaveText(cancelledMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".cancel-processing")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("message-to-cancel.png");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "message-to-cancel.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("Cancelled");
  await expect(persisted.locator(".processing-note")).toHaveText(cancelledMessage);
  await expect(persisted.locator(".process-file")).toHaveText("Retry");
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
