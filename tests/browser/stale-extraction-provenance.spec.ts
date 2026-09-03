import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const staleMessage = "Stored extraction does not match this original. Process the source again.";

test("blocks derived text whose hash does not match the original", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return []; } } });
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1, height: 1, close() {} }) });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Stale extraction provenance");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that derived text cannot detach from its original hash.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({ name: "source.png", mimeType: "image/png", buffer: imageBytes });
  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    const staleJob = { fileId: file.id, caseId, fileHash: "b".repeat(64), status: "ready_for_ai", message: "Local OCR text is ready for review.", updatedAt: new Date().toISOString(), artifact: { adapterId: "local-image-ocr", adapterVersion: "1.0.0+stale-test-1", text: "Text from different bytes", pages: [{ pageNumber: 1, text: "Text from different bytes", start: 0, end: 25 }], warnings: [] } };
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("processing", "readwrite");
        tx.objectStore("processing").put(staleJob);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
      });
    } finally { db.close(); }
  });
  await page.reload();
  const row = page.locator(".file-row", { hasText: "source.png" });
  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(staleMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("source.png");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await expect(preview.locator("#preview-hash")).not.toHaveText("b".repeat(64));
  await preview.locator("#close-preview").click();
  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "source.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(staleMessage);
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
