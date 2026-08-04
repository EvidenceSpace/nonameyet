import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createPdfJsTextAdapter, type BinaryFileDescriptor, type PdfJsRuntime } from "../src/processing/adapters/pdfjs.js";

const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);
const hash = createHash("sha256").update(pdf).digest("hex");
const file: BinaryFileDescriptor = {
  id: "pdf",
  caseId: "case",
  name: "evidence.pdf",
  type: "application/pdf",
  size: pdf.length,
  sha256: hash,
  readBytes: async () => pdf,
};

function runtime(numPages: number, readablePages: ReadonlySet<number>): PdfJsRuntime {
  return {
    version: "4.10.38",
    getDocument() {
      return {
        promise: Promise.resolve({
          numPages,
          getPage: async (pageNumber) => ({
            getTextContent: async () => ({ items: readablePages.has(pageNumber) ? [{ str: "Readable contract text" }] : [] }),
          }),
        }),
      };
    },
  };
}

test("summarizes blank-page warnings for a mixed 121-page PDF", async () => {
  const result = await createPdfJsTextAdapter(runtime(121, new Set([1])), { minTextCharacters: 1 }).extract(file, {});
  assert.equal(result.kind, "text");
  assert.deepEqual(result.warnings, [
    "120 pages have no readable text layer (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, and 100 more).",
  ]);
});

test("keeps a fully scanned 500-page PDF warning bounded", async () => {
  const result = await createPdfJsTextAdapter(runtime(500, new Set()), { minTextCharacters: 1 }).extract(file, {});
  assert.equal(result.kind, "needs_ocr");
  const warnings = result.warnings ?? [];
  assert.equal(warnings.length, 1);
  assert.ok(warnings[0].length < 1_000);
  assert.match(warnings[0], /^500 pages have no readable text layer/);
});
