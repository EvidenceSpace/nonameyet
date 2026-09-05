import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const unavailableMessage = "Local OCR is unavailable before processing begins. This browser does not provide the on-device text detection CaseFind currently requires. The original remains stored locally; review it manually or try a browser or device with on-device text detection.";

test("preflights unavailable local OCR without creating a doomed processing job", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "TextDetector", { value: undefined, configurable: true });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("OCR unavailable boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that unavailable local OCR fails honestly.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [
    { name: "message.png", mimeType: "image/png", bytes: imageBytes },
  ]);

  const row = page.locator(".file-row", { hasText: "message.png" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".processing-status")).toHaveText("OCR unavailable");
  await expect(row.locator(".processing-note")).toHaveText(unavailableMessage);
  await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(page.locator(".ocr-readiness-notice")).toContainText("Local OCR unavailable");
  await expect(page.locator(".ocr-readiness-notice")).toContainText("original remains stored locally");
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("message.png");
  await expect(preview.locator("#preview-type")).toHaveText("image/png");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await expect(preview.locator("#record-preview img")).toHaveAttribute("src", /^blob:/);
  await preview.locator("#close-preview").click();

  await page.reload();
  await waitForWorkspace(page);
  const persisted = page.locator(".file-row", { hasText: "message.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("OCR unavailable");
  await expect(persisted.locator(".processing-note")).toHaveText(unavailableMessage);
  await expect(persisted.locator(".process-file")).toHaveCount(0);
  await expect(page.locator(".file-row")).toHaveCount(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
