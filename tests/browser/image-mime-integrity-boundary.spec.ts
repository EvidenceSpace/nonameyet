import { expect, test } from "playwright/test";

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const mismatchMessage = "The stored image bytes do not match this image record.";

test("fails closed when image bytes do not match the declared media type", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Image media integrity");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that mismatched image bytes fail closed.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "mislabeled-message.jpg",
    mimeType: "image/jpeg",
    buffer: pngBytes,
  });
  const row = page.locator(".file-row", { hasText: "mislabeled-message.jpg" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".processing-status")).toHaveText("Not processed");
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("Failed");
  await expect(row.locator(".processing-note")).toHaveText(mismatchMessage);
  await expect(row.locator(".process-file")).toHaveText("Retry");
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("mislabeled-message.jpg");
  await expect(preview.locator("#preview-type")).toHaveText("image/jpeg");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await expect(preview.locator("#record-preview img")).toHaveAttribute("src", /^blob:/);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "mislabeled-message.jpg" });
  await expect(persisted.locator(".processing-status")).toHaveText("Failed");
  await expect(persisted.locator(".processing-note")).toHaveText(mismatchMessage);
  await expect(persisted.locator(".process-file")).toHaveText("Retry");
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  await expect(page.locator(".file-row")).toHaveCount(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
