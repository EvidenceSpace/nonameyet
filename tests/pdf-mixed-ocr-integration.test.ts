import assert from "node:assert/strict";
import test from "node:test";
import { isValidExtractionArtifact } from "../web/extraction-artifact.js";
import { processPdf } from "../web/pdf-processing.js";

const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const file = {
  id: "pdf",
  caseId: "case",
  sha256: "hash",
  original: { size: bytes.length, arrayBuffer: async () => bytes.slice().buffer },
};

function pdfRuntime(textByPage: string[], counters = { pageCleanups: 0, documentDestroys: 0 }) {
  const document = {
    numPages: textByPage.length,
    async getPage(pageNumber: number) {
      return {
        originalPageNumber: pageNumber,
        async getTextContent() {
          return { items: textByPage[pageNumber - 1] ? [{ str: textByPage[pageNumber - 1] }] : [] };
        },
        cleanup() { counters.pageCleanups += 1; },
      };
    },
    async destroy() { counters.documentDestroys += 1; },
  };
  return {
    counters,
    runtime: {
      version: "4.10.38",
      getDocument: () => ({ promise: Promise.resolve(document) }),
    },
  };
}

const detector = { id: "text-detector-raster", version: "1", recognizeSource() {} };

function ocrResult(pages: Array<{ pageNumber: number; text: string; confidence?: number }>, confidence = 0.82) {
  return {
    pages,
    text: pages.map((page) => page.text).filter(Boolean).join("\n\n"),
    warnings: [],
    confidence,
    adapterId: "pdf-page-ocr",
    adapterVersion: "1.0.0+text-detector-raster-1",
  };
}

test("OCRs only missing pages and merges them in original order", async () => {
  const fixture = pdfRuntime(["Selectable contract text remains available.", "", "Native signature page text."]);
  const loadedOriginalPages: number[] = [];
  const progress: any[] = [];
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    onOcrProgress: (value: any) => progress.push(value),
    ocrDocument: async (subset: any, options: any) => {
      assert.equal(subset.numPages, 1);
      const page = await subset.getPage(1);
      loadedOriginalPages.push(page.originalPageNumber);
      page.cleanup();
      options.onProgress({ completedPages: 1, totalPages: 1, pageNumber: 1, status: "recognized" });
      return ocrResult([{ pageNumber: 1, text: "OCR exhibit page text.", confidence: 0.82 }]);
    },
  });
  assert.equal(result.status, "ready_for_ai");
  assert.deepEqual(loadedOriginalPages, [2]);
  assert.deepEqual(progress.map((item) => item.pageNumber), [2]);
  assert.deepEqual(result.artifact?.pages, [
    { pageNumber: 1, text: "Selectable contract text remains available." },
    { pageNumber: 2, text: "OCR exhibit page text." },
    { pageNumber: 3, text: "Native signature page text." },
  ]);
  assert.equal(result.artifact?.adapterId, "pdfjs-text+local-pdf-ocr");
  assert.equal(result.artifact?.quality?.level, "medium");
  assert.equal(isValidExtractionArtifact(result.artifact), true);
  assert.match(result.message, /selectable text and local OCR/);
  assert.deepEqual(fixture.counters, { pageCleanups: 4, documentDestroys: 1 });
});

test("promotes a fully scanned PDF only after successful local OCR", async () => {
  const fixture = pdfRuntime(["", ""]);
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    ocrDocument: async () => ocrResult([
      { pageNumber: 1, text: "Scanned agreement first page.", confidence: 0.95 },
      { pageNumber: 2, text: "Scanned agreement second page.", confidence: 0.95 },
    ], 0.95),
  });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.adapterId, "local-pdf-ocr");
  assert.equal(result.artifact?.text, "Scanned agreement first page.\n\nScanned agreement second page.");
  assert.equal(result.artifact?.quality?.reviewRequired, true);
  assert.equal(isValidExtractionArtifact(result.artifact), true);
});

test("keeps unresolved OCR pages explicit after a partial OCR success", async () => {
  const fixture = pdfRuntime(["Readable selectable contract text.", "", ""]);
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    ocrDocument: async () => ocrResult([
      { pageNumber: 1, text: "Recovered exhibit text.", confidence: 0.91 },
      { pageNumber: 2, text: "", confidence: undefined },
    ], 0.91),
  });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.pages[2].text, "");
  assert.match(result.artifact?.warnings[0], /Page 3 has no readable text after local OCR/);
  assert.match(result.message, /Page 3 has no readable text after local OCR/);
  assert.equal(isValidExtractionArtifact(result.artifact), true);
});

test("preserves selectable text with a truthful warning when OCR fails", async () => {
  const fixture = pdfRuntime(["Readable selectable contract text.", ""]);
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    ocrDocument: async () => { throw Object.assign(new Error("failed"), { code: "ocr_timeout" }); },
  });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.adapterId, "pdfjs-text");
  assert.equal(result.artifact?.text, "Readable selectable contract text.");
  assert.match(result.artifact?.warnings[0], /Local OCR did not complete for page 2/);
  assert.equal(result.artifact?.quality, undefined);
  assert.equal(isValidExtractionArtifact(result.artifact), true);
});

test("rejects oversized OCR output before merging it", async () => {
  const fixture = pdfRuntime(["Readable selectable contract text.", ""]);
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    maxTextCharacters: 50,
    ocrDocument: async () => ocrResult([
      { pageNumber: 1, text: "x".repeat(51), confidence: 0.9 },
    ], 0.9),
  });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.text, "Readable selectable contract text.");
  assert.match(result.artifact?.warnings[0], /Local OCR did not complete/);
});

test("does not claim AI-ready text for a scanned PDF when OCR fails", async () => {
  const fixture = pdfRuntime([""]);
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    ocrDocument: async () => { throw new Error("failed"); },
  });
  assert.equal(result.status, "needs_ocr");
  assert.equal(result.artifact, undefined);
  assert.match(result.message, /could not produce AI-ready text/);
});

test("cancellation during OCR remains cancellation and destroys the document", async () => {
  const fixture = pdfRuntime([""]);
  const controller = new AbortController();
  let startedResolve: () => void = () => {};
  const started = new Promise<void>((resolve) => { startedResolve = resolve; });
  const pending = processPdf(file, {
    signal: controller.signal,
    runtime: fixture.runtime,
    ocrRuntime: detector,
    ocrDocument: () => new Promise(() => {
      startedResolve();
    }),
  });
  await started;
  controller.abort();
  const result = await pending;
  assert.equal(result.status, "cancelled");
  assert.equal(result.artifact, undefined);
  assert.equal(fixture.counters.documentDestroys, 1);
});

test("gives local OCR its own bounded phase deadline", async () => {
  const fixture = pdfRuntime([""]);
  let receivedTimeout: number | undefined;
  const result = await processPdf(file, {
    runtime: fixture.runtime,
    ocrRuntime: detector,
    timeoutMs: 40,
    ocrTimeoutMs: 250,
    ocrDocument: async (_document: any, options: any) => {
      receivedTimeout = options.timeoutMs;
      await new Promise((resolve) => setTimeout(resolve, 80));
      return ocrResult([
        { pageNumber: 1, text: "Recovered after selectable extraction deadline.", confidence: 0.9 },
      ], 0.9);
    },
  });
  assert.equal(receivedTimeout, 250);
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.adapterId, "local-pdf-ocr");
  assert.equal(isValidExtractionArtifact(result.artifact), true);
});
