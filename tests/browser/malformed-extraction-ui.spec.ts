import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const invalidMessage = "Stored extraction is invalid. Process the source again.";

test("blocks malformed derived pages before review or analysis", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Malformed extraction UI boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying malformed local derivatives fail closed in the workspace.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "source.png", mimeType: "image/png", buffer: imageBytes });

  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveProcessing({
      fileId: file.id,
      caseId,
      fileHash: file.sha256,
      status: "ready_for_ai",
      message: "Local OCR text is ready for review.",
      updatedAt: new Date().toISOString(),
      artifact: {
        adapterId: "local-image-ocr",
        adapterVersion: "1.0.0+malformed-test-1",
        text: "Conflicting text",
        pages: [
          { pageNumber: 1, text: "First value", start: 0, end: 11 },
          { pageNumber: 1, text: "Conflicting value", start: 12, end: 29 },
        ],
        warnings: [],
      },
    });
  });
  await page.reload();

  const row = page.locator(".file-row", { hasText: "source.png" });
  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(invalidMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  await expect(page.locator("#preview-dialog")).toBeVisible();
  await expect(page.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await page.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "source.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(invalidMessage);
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
