import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import test from "node:test";
import { buildPdfPageCoverageWarnings } from "../web/pdf-page-coverage.js";
import { processPdf } from "../web/pdf-processing.js";

const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const hash = createHash("sha256").update(bytes).digest("hex");
const expected = "120 pages have no selectable text and were not included in AI-ready text (pages 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, and 100 more). Review them in the original PDF.";

test("builds a bounded and actionable mixed-PDF coverage warning", () => {
  assert.deepEqual(buildPdfPageCoverageWarnings(Array.from({ length: 120 }, (_, index) => index + 2)), [expected]);
  assert.ok(expected.length < 1_000);
});

test("persists and surfaces incomplete page coverage for AI-ready PDF text", async () => {
  const result = await processPdf({
    id: "pdf",
    caseId: "case",
    sha256: hash,
    original: { size: bytes.length, arrayBuffer: async () => bytes.slice().buffer },
  }, {
    cryptoImpl: webcrypto,
    runtime: {
      version: "4.10.38",
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 121,
          getPage: async (pageNumber: number) => ({
            getTextContent: async () => ({ items: pageNumber === 1 ? [{ str: "Readable contract text" }] : [] }),
          }),
        }),
      }),
    },
  });
  assert.equal(result.status, "ready_for_ai");
  assert.deepEqual(result.artifact?.warnings, [expected]);
  assert.equal(result.message, `Text ready from 1 of 121 pages. ${expected}`);
  assert.equal(result.artifact?.text, "Readable contract text");
});
