import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const unavailableMessage = "Local image OCR is unavailable in this browser. Your image remains stored locally and was not uploaded.";

test("fails honestly when local image OCR is unavailable and preserves the original", async ({ page }) => {
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
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "message.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  const row = page.locator(".file-row", { hasText: "message.png" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".processing-status")).toHaveText("Not processed");
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(unavailableMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
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
  const persisted = page.locator(".file-row", { hasText: "message.png" });
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(unavailableMessage);
  await expect(persisted.locator(".process-file")).toHaveText("Retry");
  await expect(page.locator(".file-row")).toHaveCount(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
