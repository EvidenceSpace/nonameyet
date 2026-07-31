import { createHash } from "node:crypto";
import { expect, test } from "playwright/test";

const sourceBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const expectedHash = createHash("sha256").update(sourceBytes).digest("hex");

test("persists, identifies, previews, deduplicates, and removes an original source", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Original source preview");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case used to verify local source-byte handling and preview.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  const fileInput = page.locator("#file-input");
  await fileInput.setInputFiles({ name: "source-preview.png", mimeType: "image/png", buffer: sourceBytes });
  const row = page.locator(".file-row");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("source-preview.png");
  await expect(row).toContainText(`SHA-256 ${expectedHash.slice(0, 10)}…`);
  await expect(page.locator("#file-count")).toHaveText("1");

  await row.locator(".preview-file").click();
  const dialog = page.locator("#preview-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#preview-title")).toHaveText("source-preview.png");
  await expect(dialog.locator("#preview-type")).toHaveText("image/png");
  await expect(dialog.locator("#preview-hash")).toHaveText(expectedHash);
  const image = dialog.locator("#record-preview img");
  await expect(image).toHaveAttribute("src", /^blob:/);
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth)).toBe(1);
  await dialog.locator("#close-preview").click();
  await expect(dialog).toBeHidden();
  await expect(dialog.locator("#record-preview")).toBeEmpty();

  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator(".file-row")).toHaveCount(1);
  await page.locator(".file-row .preview-file").click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#preview-hash")).toHaveText(expectedHash);
  await dialog.locator("#close-preview").click();

  await fileInput.setInputFiles({ name: "duplicate.png", mimeType: "image/png", buffer: sourceBytes });
  await expect(page.locator("#upload-message")).toContainText("duplicate.png is already in this case");
  await expect(page.locator(".file-row")).toHaveCount(1);

  await page.locator(".file-row .delete-file").click();
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("0");
  await expect(page.locator(".empty-files")).toContainText("No records added yet");
  await page.reload();
  await expect(page.locator(".file-row")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
