import { expect, test } from "playwright/test";

const malformedPdf = Buffer.from(
  "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nThis file is intentionally truncated.",
  "ascii",
);
const corruptMessage = "This PDF appears damaged or incomplete. CaseFind did not extract text. The original remains stored locally; replace it with a complete PDF or review it manually.";

test("fails permanently for a malformed PDF while preserving the original", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Malformed PDF boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that malformed PDF processing fails closed.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({ name: "damaged-invoice.pdf", mimeType: "application/pdf", buffer: malformedPdf });
  const row = page.locator(".file-row", { hasText: "damaged-invoice.pdf" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".processing-status")).toHaveText("Not processed");
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("Needs attention", { timeout: 30_000 });
  await expect(row.locator(".processing-note")).toHaveText(corruptMessage);
  await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("damaged-invoice.pdf");
  await expect(preview.locator("#preview-type")).toHaveText("application/pdf");
  await expect(preview.locator("#preview-size")).not.toHaveText("0 bytes");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await expect(preview.locator("#record-preview embed[type='application/pdf']")).toHaveCount(1);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "damaged-invoice.pdf" });
  await expect(persisted.locator(".processing-status")).toHaveText("Needs attention");
  await expect(persisted.locator(".processing-note")).toHaveText(corruptMessage);
  await expect(persisted.locator(".process-file")).toHaveCount(0);
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  await expect(persisted.locator(".analyze-record")).toHaveCount(0);
  await expect(page.locator(".file-row")).toHaveCount(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
