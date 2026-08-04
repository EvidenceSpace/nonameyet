import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PDF_OCR_PAGES,
  ocrPdfDocument,
} from "../web/pdf-document-ocr.js";

function documentFixture(numPages: number) {
  const cleaned: number[] = [];
  return {
    document: {
      numPages,
      async getPage(pageNumber: number) {
        return {
          pageNumber,
          cleanup() { cleaned.push(pageNumber); },
        };
      },
    },
    cleaned,
  };
}

function result(text: string, confidence = 0.8) {
  return {
    text,
    confidence,
    adapterId: "pdf-page-ocr",
    adapterVersion: "1.0.0+text-detector-raster-1",
  };
}

test("processes pages sequentially, aggregates output, and cleans each page", async () => {
  const fixture = documentFixture(3);
  const active: number[] = [];
  const progress: any[] = [];
  const output = await ocrPdfDocument(fixture.document, {
    ocrPage: async (page: any) => {
      assert.deepEqual(active, []);
      active.push(page.pageNumber);
      await Promise.resolve();
      active.pop();
      return result(`Page ${page.pageNumber}`, page.pageNumber / 4);
    },
    onProgress: (value: any) => progress.push(value),
  });
  assert.equal(output.text, "Page 1\n\nPage 2\n\nPage 3");
  assert.deepEqual(output.pages.map((page: any) => page.pageNumber), [1, 2, 3]);
  assert.equal(output.confidence, 0.5);
  assert.equal(output.adapterId, "pdf-page-ocr");
  assert.deepEqual(fixture.cleaned, [1, 2, 3]);
  assert.deepEqual(progress.map((item) => item.completedPages), [1, 2, 3]);
});

test("preserves blank page positions with one bounded review warning", async () => {
  const fixture = documentFixture(3);
  const output = await ocrPdfDocument(fixture.document, {
    ocrPage: async (page: any) => {
      if (page.pageNumber === 2) {
        throw Object.assign(new Error("blank"), { code: "empty_text" });
      }
      return result(`Page ${page.pageNumber}`);
    },
  });
  assert.deepEqual(output.pages, [
    { pageNumber: 1, text: "Page 1", confidence: 0.8 },
    { pageNumber: 2, text: "", confidence: undefined },
    { pageNumber: 3, text: "Page 3", confidence: 0.8 },
  ]);
  assert.equal(output.warnings.length, 1);
  assert.match(output.warnings[0], /page 2/);
  assert.deepEqual(fixture.cleaned, [1, 2, 3]);
});

test("rejects documents above the OCR page budget before loading pages", async () => {
  let loaded = false;
  await assert.rejects(() => ocrPdfDocument({
    numPages: MAX_PDF_OCR_PAGES + 1,
    async getPage() {
      loaded = true;
      return {};
    },
  }), (error: any) => error.code === "too_many_pages");
  assert.equal(loaded, false);
});

test("fails closed when aggregate text exceeds the document limit", async () => {
  const fixture = documentFixture(2);
  await assert.rejects(() => ocrPdfDocument(fixture.document, {
    maxCharacters: 10,
    ocrPage: async () => result("12345"),
  }), (error: any) => error.code === "output_too_large");
  assert.deepEqual(fixture.cleaned, [1, 2]);
});

test("document timeout cancels stalled page OCR and cleans the active page", async () => {
  const fixture = documentFixture(1);
  let aborted = false;
  await assert.rejects(() => ocrPdfDocument(fixture.document, {
    timeoutMs: 10,
    ocrPage: (_page: any, { signal }: { signal: AbortSignal }) => new Promise((resolve) => {
      signal.addEventListener("abort", () => {
        aborted = true;
        resolve(result("late"));
      }, { once: true });
    }),
  }), (error: any) => error.code === "ocr_timeout");
  assert.equal(aborted, true);
  assert.deepEqual(fixture.cleaned, [1]);
});

test("late page loads after timeout are cleaned", async () => {
  let resolvePage: (value: any) => void = () => {};
  let cleaned = 0;
  const pending = ocrPdfDocument({
    numPages: 1,
    getPage: () => new Promise((resolve) => { resolvePage = resolve; }),
  }, {
    timeoutMs: 10,
    ocrPage: async () => result("unused"),
  });
  await assert.rejects(pending, (error: any) => error.code === "ocr_timeout");
  resolvePage({ cleanup() { cleaned += 1; } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(cleaned, 1);
});
