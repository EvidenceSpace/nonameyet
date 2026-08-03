import { expect, test } from "playwright/test";

const invalidPdfMessage = "This file does not contain a valid PDF header. CaseFind did not open it as a PDF or extract text. The original remains stored locally; verify the file format and add a genuine PDF explicitly.";

test("rejects mislabeled PDF bytes before parsing while preserving the original", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("PDF signature boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying PDF byte signatures before local parsing.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "renamed-notes.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("Plain text renamed to PDF", "utf8"),
  });
  const row = page.locator(".file-row", { hasText: "renamed-notes.pdf" });
  await expect(row).toContainText("Stored locally");
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("Needs attention");
  await expect(row.locator(".processing-note")).toHaveText(invalidPdfMessage);
  await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("renamed-notes.pdf");
  await expect(preview.locator("#preview-size")).not.toHaveText("0 bytes");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "renamed-notes.pdf" });
  await expect(persisted.locator(".processing-status")).toHaveText("Needs attention");
  await expect(persisted.locator(".processing-note")).toHaveText(invalidPdfMessage);
  await expect(persisted.locator(".process-file")).toHaveCount(0);
  await expect(page.locator(".file-row")).toHaveCount(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
