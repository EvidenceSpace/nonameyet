import assert from "node:assert/strict";
import test from "node:test";
import { processPdf } from "../web/pdf-processing.js";
import { getScannedPdfRecovery } from "../web/scanned-pdf-recovery.js";

const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const file = {
  id: "scanned-pdf",
  caseId: "case",
  sha256: "86edbaa24831badfa0a8b04bb410141e2ee4182b6d0014493fe262a7a331c20b",
  original: { size: bytes.length, arrayBuffer: async () => bytes.slice().buffer },
};

function blankPdfRuntime() {
  const document = {
    numPages: 1,
    async getPage() {
      return {
        async getTextContent() { return { items: [] }; },
        cleanup() {},
      };
    },
    async destroy() {},
  };
  return {
    version: "4.10.38",
    getDocument: () => ({ promise: Promise.resolve(document) }),
  };
}

function shortTextPdfRuntime() {
  const document = {
    numPages: 1,
    async getPage() {
      return {
        async getTextContent() { return { items: [{ str: "Short note" }] }; },
        cleanup() {},
      };
    },
    async destroy() {},
  };
  return {
    version: "4.10.38",
    getDocument: () => ({ promise: Promise.resolve(document) }),
  };
}

const detector = { id: "text-detector-raster", version: "1", recognizeSource() {} };

function recognizedResult(text: string) {
  return {
    pages: [{ pageNumber: 1, text, confidence: 0.9 }],
    text,
    warnings: [],
    confidence: 0.9,
    adapterId: "pdf-page-ocr",
    adapterVersion: "1.0.0+text-detector-raster-1",
  };
}

test("classifies a transient scanned-PDF OCR failure and permits an explicit local retry", async () => {
  const first = await processPdf(file, {
    runtime: blankPdfRuntime(),
    ocrRuntime: detector,
    ocrDocument: async () => { throw new Error("detector restarted"); },
  });
  assert.equal(first.status, "needs_ocr");
  assert.deepEqual(first.failure, { code: "transient_error", retryable: true });
  assert.equal(first.artifact, undefined);

  const recovery = getScannedPdfRecovery({
    status: first.status,
    imageOcrAvailable: true,
    failure: first.failure,
  });
  assert.equal(recovery?.canRetryPdfExtraction, true);
  assert.equal(recovery?.retryLabel, "Retry local OCR");
  assert.match(recovery?.message || "", /without uploading it/);

  const retry = await processPdf(file, {
    runtime: blankPdfRuntime(),
    ocrRuntime: detector,
    ocrDocument: async () => recognizedResult("Recovered local OCR text from the retried scanned PDF."),
  });
  assert.equal(retry.status, "ready_for_ai");
  assert.equal(retry.artifact?.adapterId, "local-pdf-ocr");
  assert.equal(retry.artifact?.text, "Recovered local OCR text from the retried scanned PDF.");
});

test("keeps empty OCR output non-retryable", async () => {
  const result = await processPdf(file, {
    runtime: blankPdfRuntime(),
    ocrRuntime: detector,
    ocrDocument: async () => { throw Object.assign(new Error("blank"), { code: "empty_text" }); },
  });
  assert.equal(result.status, "needs_ocr");
  assert.deepEqual(result.failure, { code: "empty_text", retryable: false });
  assert.equal(getScannedPdfRecovery({
    status: result.status,
    imageOcrAvailable: true,
    failure: result.failure,
  })?.canRetryPdfExtraction, false);
});

test("does not offer a retry when the browser has no PDF OCR runtime", async () => {
  const result = await processPdf(file, {
    runtime: blankPdfRuntime(),
    ocrRuntime: null,
  });
  assert.equal(result.status, "needs_ocr");
  assert.deepEqual(result.failure, { code: "ocr_unavailable", retryable: false });
  const recovery = getScannedPdfRecovery({
    status: result.status,
    imageOcrAvailable: false,
    failure: result.failure,
  });
  assert.equal(recovery?.canRetryPdfExtraction, false);
  assert.match(recovery?.message || "", /cannot run CaseFind’s current local OCR/);
});

test("does not retry a deterministic too-little-text result", async () => {
  let ocrStarts = 0;
  const result = await processPdf(file, {
    runtime: shortTextPdfRuntime(),
    ocrRuntime: detector,
    ocrDocument: async () => {
      ocrStarts += 1;
      return recognizedResult("unused");
    },
  });
  assert.equal(result.status, "needs_ocr");
  assert.deepEqual(result.failure, { code: "insufficient_text", retryable: false });
  assert.equal(ocrStarts, 0);
  assert.equal(getScannedPdfRecovery({
    status: result.status,
    imageOcrAvailable: true,
    failure: result.failure,
  })?.canRetryPdfExtraction, false);
});

test("does not retry deterministic OCR limits, source errors, or invalid output", async () => {
  for (const code of [
    "too_many_pages",
    "page_too_large",
    "file_too_large",
    "output_too_large",
    "invalid_output",
    "corrupt_file",
    "adapter_unavailable",
  ]) {
    const result = await processPdf(file, {
      runtime: blankPdfRuntime(),
      ocrRuntime: detector,
      ocrDocument: async () => { throw Object.assign(new Error(code), { code }); },
    });
    assert.equal(result.status, "needs_ocr");
    assert.deepEqual(result.failure, { code, retryable: false });
    assert.equal(getScannedPdfRecovery({
      status: result.status,
      imageOcrAvailable: true,
      failure: result.failure,
    })?.canRetryPdfExtraction, false);
  }
});
