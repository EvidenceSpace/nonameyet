import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const emptyTextMessage = "No readable text was found in this image. The original remains stored locally; review it manually or add a clearer image explicitly.";

test("marks empty local OCR output as permanent without an artifact", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({ width: 1200, height: 800, close() {} }) });
    Object.defineProperty(globalThis, "TextDetector", { configurable: true, value: class { async detect() { return [{ rawValue: "  ", boundingBox: { x: 1, y: 1 } }]; } } });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("No readable OCR text"); await page.locator("#client").fill("Example client"); await page.locator("#amount").fill("5000"); await page.locator("#summary").fill("Verify empty OCR output cannot become evidence.");
  await page.locator("#continue-button").click(); await page.locator("#continue-button").click(); await page.locator("#local-storage-ack").check(); await page.locator("#continue-button").click(); await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({ name: "unreadable-message.png", mimeType: "image/png", buffer: imageBytes });
  const row = page.locator(".file-row", { hasText: "unreadable-message.png" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".process-file")).toBeEnabled();
  await row.locator(".process-file").click();
  await expect.poll(async () => page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [job] = await storage.getProcessingForCase(caseId);
    return job ? { failure: job.failure, hasArtifact: Object.hasOwn(job, "artifact") } : null;
  })).toEqual({ failure: { code: "empty_text", retryable: false }, hasArtifact: false });
  await expect(row.locator(".processing-status")).toHaveText("Needs attention"); await expect(row.locator(".processing-note")).toHaveText(emptyTextMessage); await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0); await expect(row.locator(".analyze-record")).toHaveCount(0); await expect(page.locator(".fact-record")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  const persisted = page.locator(".file-row", { hasText: "unreadable-message.png" }); await expect(persisted.locator(".processing-status")).toHaveText("Needs attention"); await expect(persisted.locator(".processing-note")).toHaveText(emptyTextMessage); await expect(persisted.locator(".process-file")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
