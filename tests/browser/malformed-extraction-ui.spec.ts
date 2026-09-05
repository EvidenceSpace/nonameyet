import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const invalidMessage = "Stored extraction is invalid. Process the source again.";

test("blocks an inconsistent artifact even when its pages alone are valid", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return []; } } });
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1, height: 1, close() {} }) });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });

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
  await seedWorkspaceFiles(page, [{ id: "file_malformed_extraction", name: "source.png", mimeType: "image/png", buffer: imageBytes }]);
  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveProcessing({ fileId: file.id, caseId, fileHash: file.sha256, status: "ready_for_ai", message: "Local OCR text is ready for review.", updatedAt: new Date().toISOString(), artifact: { adapterId: "local-image-ocr", adapterVersion: "1.0.0+malformed-test-2", text: "Conflicting combined text", pages: [{ pageNumber: 1, text: "Individually valid page text", start: 0, end: 28 }], warnings: [] } });
  });
  await page.reload();
  await waitForWorkspace(page);
  const row = page.locator(".file-row", { hasText: "source.png" });
  await expect(row).toBeVisible();
  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(invalidMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  await expect(row.locator(".preview-file")).toBeEnabled();
  await row.locator(".preview-file").click();
  await expect(page.locator("#preview-dialog")).toBeVisible();
  await expect(page.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await page.locator("#close-preview").click();
  await expect(page.locator("#preview-dialog")).toBeHidden();
  await page.reload();
  await waitForWorkspace(page);
  const persisted = page.locator(".file-row", { hasText: "source.png" });
  await expect(persisted).toBeVisible();
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(invalidMessage);
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
