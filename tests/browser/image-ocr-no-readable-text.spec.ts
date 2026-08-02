import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const emptyTextMessage = "No readable text was found in this image.";

test("fails closed when local OCR finds no readable text", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", {
      configurable: true,
      value: async () => ({ width: 1200, height: 800, close() {} }),
    });
    class EmptyTextDetector {
      async detect() {
        return [
          { rawValue: "  \t", boundingBox: { x: 10, y: 10 } },
          { rawValue: "", boundingBox: { x: 10, y: 20 } },
        ];
      }
    }
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: EmptyTextDetector });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("No readable OCR text boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that empty local OCR output cannot become evidence.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "unreadable-message.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  const row = page.locator(".file-row", { hasText: "unreadable-message.png" });
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(emptyTextMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);

  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const jobs = await storage.getProcessingForCase(caseId);
    const facts = await storage.getFactsForCase(caseId);
    const suggestions = await storage.getSuggestionsForCase(caseId);
    return { jobs, facts, suggestions };
  });
  expect(stored.jobs).toHaveLength(1);
  expect(stored.jobs[0].status).toBe("failed");
  expect(stored.jobs[0].message).toBe(emptyTextMessage);
  expect(stored.jobs[0].failure).toEqual({ code: "empty_text", retryable: false });
  expect(stored.jobs[0].artifact).toBeUndefined();
  expect(stored.facts).toEqual([]);
  expect(stored.suggestions).toEqual([]);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("unreadable-message.png");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "unreadable-message.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(emptyTextMessage);
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  await expect(persisted.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
