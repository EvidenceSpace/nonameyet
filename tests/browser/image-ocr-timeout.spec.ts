import { expect, test } from "playwright/test";

const imageBytes = Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
));

test("bounds a stalled local OCR runtime and preserves a retryable failure", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  await page.goto("/");

  const outcome = await page.evaluate(async (bytes) => {
    const { processImage } = await import("/image-ocr.js");
    const original = new Blob([Uint8Array.from(bytes)], { type: "image/png" });
    const started = performance.now();
    const result = await processImage({
      id: "file-timeout",
      caseId: "case-timeout",
      sha256: "431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460",
      type: "image/png",
      size: original.size,
      original,
    }, {
      timeoutMs: 25,
      runtime: {
        id: "stalled-test-runtime",
        version: "1",
        recognize: () => new Promise(() => {}),
      },
    });
    return { result, elapsed: performance.now() - started };
  }, imageBytes);

  expect(outcome.elapsed).toBeLessThan(1_000);
  expect(outcome.result.status).toBe("failed");
  expect(outcome.result.message).toBe("Local OCR timed out. Your original remains stored locally. Retry when the device is ready.");
  expect(outcome.result.failure).toEqual({ code: "ocr_timeout", retryable: true });
  expect(outcome.result.fileId).toBe("file-timeout");
  expect(outcome.result.caseId).toBe("case-timeout");
  expect(outcome.result.fileHash).toBe("431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
