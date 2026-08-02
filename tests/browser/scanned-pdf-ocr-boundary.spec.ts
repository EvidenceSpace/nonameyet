import { expect, test } from "playwright/test";

function createImageOnlyPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let pdf = "%PDF-1.7\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

const ocrMessage = "This PDF has too little selectable text. OCR is needed.";

test("routes an image-only PDF to an explicit OCR-needed state", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Scanned PDF boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that image-only PDFs require honest OCR handling.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "scanned-invoice.pdf",
    mimeType: "application/pdf",
    buffer: createImageOnlyPdf(),
  });
  const row = page.locator(".file-row", { hasText: "scanned-invoice.pdf" });
  await expect(row.locator(".processing-status")).toHaveText("Not processed");
  await row.locator(".process-file").click();

  await expect(row.locator(".processing-status")).toHaveText("OCR needed", { timeout: 30_000 });
  await expect(row.locator(".processing-note")).toHaveText(ocrMessage);
  await expect(row.locator(".process-file")).toHaveCount(0);
  await expect(row.locator(".view-extracted-text")).toHaveCount(0);
  await expect(row.locator(".analyze-record")).toHaveCount(0);

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("scanned-invoice.pdf");
  await expect(preview.locator("#preview-type")).toHaveText("application/pdf");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await expect(preview.locator("#record-preview embed[type='application/pdf']")).toHaveCount(1);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "scanned-invoice.pdf" });
  await expect(persisted.locator(".processing-status")).toHaveText("OCR needed");
  await expect(persisted.locator(".processing-note")).toHaveText(ocrMessage);
  await expect(persisted.locator(".view-extracted-text")).toHaveCount(0);
  await expect(page.locator(".file-row")).toHaveCount(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
