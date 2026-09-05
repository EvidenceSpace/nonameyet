import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const expectedText = "Invoice 1042\nBalance due 5,000";

test("extracts local image text with reviewable provenance", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: async () => ({ width: 1200, height: 800, close() {} }),
    });
    class DeterministicTextDetector {
      async detect() {
        return [
          { rawValue: "Balance due 5,000", boundingBox: { x: 10, y: 60 } },
          { rawValue: "Invoice 1042", boundingBox: { x: 10, y: 10 } },
        ];
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
  await page.locator("#case-title").fill("Local OCR success boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying reviewable, local-only image text extraction.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [
    { name: "invoice-message.png", mimeType: "image/png", bytes: imageBytes },
  ]);

  const row = page.locator(".file-row", { hasText: "invoice-message.png" });
  await expect(row.locator(".process-file")).toBeEnabled();
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("Text ready");
  await expect(row.locator(".processing-note")).toHaveText("Local OCR text is ready for review.");
  await expect(row.locator(".view-extracted-text")).toHaveText("View text");
  await expect(row.locator(".analyze-record")).toHaveText("Find details");
  await expect(page.locator(".fact-record")).toHaveCount(0);

  await row.locator(".view-extracted-text").click();
  const viewer = page.locator(".text-source-dialog");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("#text-source-title")).toHaveText("invoice-message.png");
  await expect(viewer.locator("#text-source-page")).toHaveText("Page 1 of 1");
  await expect(viewer.locator("#text-source-content")).toHaveText(expectedText);
  await expect(viewer.locator("#text-source-adapter")).toHaveText("1.0.0+text-detector-1");
  await expect(viewer.locator("#text-source-hash")).toHaveText(/^SHA-256 [a-f0-9]{64}$/);
  await viewer.locator("#close-text-source").click();

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("invoice-message.png");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await preview.locator("#close-preview").click();

  await page.reload();
  await waitForWorkspace(page);
  const persisted = page.locator(".file-row", { hasText: "invoice-message.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("Text ready");
  await persisted.locator(".view-extracted-text").click();
  await expect(page.locator("#text-source-content")).toHaveText(expectedText);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
