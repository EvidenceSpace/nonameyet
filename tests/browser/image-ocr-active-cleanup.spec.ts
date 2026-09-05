import { expect, test } from "playwright/test";

test("actively releases a decoded image when local OCR times out", async ({ page }) => {
  await page.goto("/cases-new.html");
  const result = await page.evaluate(async () => {
    let closed = false;
    const module = await import("/image-ocr.js");
    const runtime = module.browserTextDetectorRuntime({
      TextDetector: class { detect() { return new Promise(() => {}); } },
      async createImageBitmap() { return { width: 100, height: 100, close() { closed = true; } }; },
    });
    const bytes = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]);
    const file = { id: "file-1", caseId: "case-1", sha256: "1b56b50ac4e976f488f128cabdcdffb2fc9331d6974bb9968131a415d14ade24", type: "image/png", size: bytes.length, original: { async arrayBuffer() { return bytes.buffer; } } };
    const job = await module.processImage(file, { runtime, timeoutMs: 10 });
    return { closed, status: job.status, failure: job.failure, hasArtifact: Boolean(job.artifact) };
  });
  expect(result).toEqual({ closed: true, status: "failed", failure: { code: "ocr_timeout", retryable: true }, hasArtifact: false });
});
