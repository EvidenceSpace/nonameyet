import { expect, test } from "playwright/test";

function createTextPdf(pageTexts: string[]) {
  const escapePdfText = (value: string) => value.replace(/([\\()])/g, "\\$1");
  const pageIds = pageTexts.map((_, index) => 3 + index);
  const fontId = 3 + pageTexts.length;
  const firstStreamId = fontId + 1;
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Count ${pageTexts.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  ];
  pageTexts.forEach((_, index) => {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${firstStreamId + index} 0 R >>`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  pageTexts.forEach((text) => {
    const stream = `BT\n/F1 18 Tf\n72 720 Td\n(${escapePdfText(text)}) Tj\nET`;
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });

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

test("extracts PDF text locally and preserves provenance across reload", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Local PDF processing");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case used to verify local PDF extraction and provenance.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  const pdf = createTextPdf([
    "Invoice total 5,000 remains unpaid.",
    "Payment is due within seven days.",
  ]);
  await page.locator("#file-input").setInputFiles({
    name: "invoice-selectable.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  const row = page.locator(".file-row", { hasText: "invoice-selectable.pdf" });
  await expect(row).toContainText("Stored locally");
  await expect(row.locator(".processing-status")).toHaveText("Not processed");
  await row.locator(".process-file").click();
  await expect(row.locator(".processing-status")).toHaveText("Text ready", { timeout: 30_000 });
  await expect(row.locator(".processing-note")).toHaveText("Text ready from 2 pages.");
  await expect(row.locator(".view-extracted-text")).toBeVisible();
  await expect(row.locator(".analyze-record")).toBeVisible();

  await row.locator(".view-extracted-text").click();
  const viewer = page.locator(".text-source-dialog");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("#text-source-title")).toHaveText("invoice-selectable.pdf");
  await expect(viewer.locator("#text-source-page")).toHaveText("Page 1 of 2");
  await expect(viewer.locator("#text-source-content")).toHaveText("Invoice total 5,000 remains unpaid.");
  await expect(viewer.locator("#text-source-adapter")).toContainText("pdfjs-");
  await expect(viewer.locator("#text-source-hash")).toHaveText(/^SHA-256 [a-f0-9]{64}$/);
  await viewer.locator("#next-text-page").click();
  await expect(viewer.locator("#text-source-page")).toHaveText("Page 2 of 2");
  await expect(viewer.locator("#text-source-content")).toHaveText("Payment is due within seven days.");
  await expect(viewer.locator("#next-text-page")).toBeDisabled();
  await viewer.locator("#close-text-source").click();

  await row.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("invoice-selectable.pdf");
  await expect(preview.locator("#preview-type")).toHaveText("application/pdf");
  await expect(preview.locator("#preview-size")).not.toHaveText("0 bytes");
  await expect(preview.locator("#preview-hash")).toHaveText(/^[a-f0-9]{64}$/);
  await expect(preview.locator("#record-preview embed[type='application/pdf']")).toHaveCount(1);
  await preview.locator("#close-preview").click();

  await page.reload();
  const persisted = page.locator(".file-row", { hasText: "invoice-selectable.pdf" });
  await expect(persisted.locator(".processing-status")).toHaveText("Text ready");
  await persisted.locator(".view-extracted-text").click();
  await expect(page.locator("#text-source-content")).toHaveText("Invoice total 5,000 remains unpaid.");
  await expect(page.locator("#text-source-hash")).toHaveText(/^SHA-256 [a-f0-9]{64}$/);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
