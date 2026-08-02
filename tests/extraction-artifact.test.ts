import assert from "node:assert/strict";
import test from "node:test";
import { isValidAnalysisPages, isValidExtractionArtifact } from "../web/extraction-artifact.js";

const valid = {
  adapterId: "local-image-ocr",
  adapterVersion: "1.0.0+test-1",
  text: "Invoice 1042\n\nBalance due 5,000",
  pages: [
    { pageNumber: 1, text: "Invoice 1042", start: 0, end: 12 },
    { pageNumber: 2, text: "Balance due 5,000", start: 14, end: 31 },
  ],
  warnings: ["Compare the extracted text with the original."],
};

test("accepts a bounded, internally consistent extraction artifact", () => {
  assert.equal(isValidExtractionArtifact(valid), true);
});

test("rejects blank pages, duplicate numbers, and excessive page text", () => {
  assert.equal(isValidAnalysisPages([{ pageNumber: 1, text: "   " }]), false);
  assert.equal(isValidAnalysisPages([{ pageNumber: 1, text: "A" }, { pageNumber: 1, text: "B" }]), false);
  assert.equal(isValidAnalysisPages([{ pageNumber: 1, text: "x".repeat(200_001) }]), false);
});

test("rejects mismatched combined text and source ranges", () => {
  assert.equal(isValidExtractionArtifact({ ...valid, text: "Different text" }), false);
  const pages = valid.pages.map((page) => ({ ...page }));
  pages[1].start = 13;
  assert.equal(isValidExtractionArtifact({ ...valid, pages }), false);
});

test("rejects missing adapter provenance and malformed warnings", () => {
  assert.equal(isValidExtractionArtifact({ ...valid, adapterId: "" }), false);
  assert.equal(isValidExtractionArtifact({ ...valid, warnings: [""] }), false);
  assert.equal(isValidExtractionArtifact({ ...valid, warnings: ["x".repeat(1_001)] }), false);
  assert.equal(isValidExtractionArtifact({ ...valid, warnings: Array.from({ length: 101 }, () => "warning") }), false);
});
