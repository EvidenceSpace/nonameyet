import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const failureMessage = "proof.png could not be removed from this device. Nothing was changed. Try again.";

test("an interrupted removal preserves the original and its processing state", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Atomic record removal");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that interrupted removal preserves every related local record.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [{ id: "file_deletion_failure", name: "proof.png", mimeType: "image/png", buffer: imageBytes }]);
  const row = page.locator(".file-row", { hasText: "proof.png" });

  const before = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveProcessing({
      fileId: file.id,
      caseId,
      fileHash: file.sha256,
      status: "failed",
      failure: { code: "test", retryable: true },
      message: "Synthetic retryable processing state.",
      updatedAt: "2026-08-03T00:00:00.000Z",
    });
    return { fileId: file.id, updatedAt: (await storage.getCase(caseId)).updatedAt };
  });
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (...args) {
      if (!injected && this.name === "cases" && this.transaction.objectStoreNames.length === 6) {
        injected = true;
        this.transaction.abort();
        throw new DOMException("Injected case activity failure", "AbortError");
      }
      return originalPut.apply(this, args as [unknown]);
    };
  });

  await row.locator(".delete-file").click();
  await expect(page.locator("#upload-message")).toHaveClass(/error/);
  await expect(page.locator("#upload-message")).toHaveText(failureMessage);
  await expect(row).toHaveCount(1);
  await expect(row.locator("button:disabled")).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("1");

  const after = await page.evaluate(async ({ fileId }) => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const files = await storage.getFilesForCase(caseId);
    const processing = await storage.getProcessingForCase(caseId);
    return {
      fileIds: files.map((file: { id: string }) => file.id),
      processingIds: processing.map((job: { fileId: string }) => job.fileId),
      updatedAt: (await storage.getCase(caseId)).updatedAt,
      fileId,
    };
  }, before);
  expect(after.fileIds).toEqual([before.fileId]);
  expect(after.processingIds).toEqual([before.fileId]);
  expect(after.updatedAt).toBe(before.updatedAt);

  await page.reload();
  await waitForWorkspace(page);
  await expect(page.locator(".file-row", { hasText: "proof.png" })).toHaveCount(1);
  await expect(page.locator("#file-count")).toHaveText("1");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
