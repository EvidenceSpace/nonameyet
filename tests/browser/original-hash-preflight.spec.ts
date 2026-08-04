import { expect, test } from "playwright/test";

test("blocks image OCR and PDF parsing when local original bytes no longer match", async ({ page }) => {
  await page.goto("/cases-new.html");
  const result = await page.evaluate(async () => {
    const wrongHash = "0".repeat(64);
    const imageModule = await import("/image-ocr.js");
    const pdfModule = await import("/pdf-processing.js");
    const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1]);
    const pdf = new TextEncoder().encode("%PDF-1.7\nchanged");
    let imageStarted = false;
    let pdfStarted = false;
    const image = await imageModule.processImage({ id: "i", caseId: "c", sha256: wrongHash, type: "image/png", size: png.length, original: { async arrayBuffer() { return png.buffer; } } }, { runtime: { id: "test", version: "1", async recognize() { imageStarted = true; } } });
    const pdfJob = await pdfModule.processPdf({ id: "p", caseId: "c", sha256: wrongHash, type: "application/pdf", size: pdf.length, original: { size: pdf.length, async arrayBuffer() { return pdf.buffer; } } }, { runtime: { version: "test", getDocument() { pdfStarted = true; } }, timeoutMs: 1_000 });
    return { imageStarted, pdfStarted, imageFailure: image.failure, pdfFailure: pdfJob.failure, imageArtifact: Boolean(image.artifact), pdfArtifact: Boolean(pdfJob.artifact) };
  });
  expect(result).toEqual({ imageStarted: false, pdfStarted: false, imageFailure: { code: "original_hash_mismatch", retryable: false }, pdfFailure: { code: "original_hash_mismatch", retryable: false }, imageArtifact: false, pdfArtifact: false });
});
