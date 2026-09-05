import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const warning = "OCR confidence is low. Compare every extracted detail with the original image.";

test("shows extraction warnings beside reviewable source text", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Extraction warning review");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that extraction uncertainty remains visible during review.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [{
    id: "file_extraction_warning",
    name: "uncertain-message.png",
    mimeType: "image/png",
    buffer: imageBytes,
  }]);

  await page.evaluate(async (visibleWarning) => {
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
        adapterVersion: "1.0.0+deterministic-warning-1",
        text: "Balance due 5,000",
        pages: [{ pageNumber: 1, text: "Balance due 5,000", start: 0, end: 17 }],
        warnings: [visibleWarning],
      },
    });
  }, warning);
  await page.reload();
  await waitForWorkspace(page);

  const row = page.locator(".file-row", { hasText: "uncertain-message.png" });
  await expect(row.locator(".processing-status")).toHaveText("Text ready");
  await row.locator(".view-extracted-text").click();
  const viewer = page.locator(".text-source-dialog");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("#text-source-warnings")).toBeVisible();
  await expect(viewer.locator("#text-source-warnings")).toHaveText(warning);
  await expect(viewer.locator("#text-source-content")).toHaveText("Balance due 5,000");
  await expect(viewer.locator("#text-source-adapter")).toHaveText("1.0.0+deterministic-warning-1");
  await expect(viewer.locator("#text-source-hash")).toHaveText(/^SHA-256 [a-f0-9]{64}$/);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
