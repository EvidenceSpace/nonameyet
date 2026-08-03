import assert from "node:assert/strict";
import test from "node:test";
import { buildImageOcrQuality, formatImageOcrQuality, OCR_LOW_CONFIDENCE_WARNING, OCR_MEDIUM_CONFIDENCE_WARNING, OCR_UNKNOWN_CONFIDENCE_WARNING } from "../web/image-ocr-quality.js";

test("normalizes bounded runtime confidence into review quality", () => {
  assert.deepEqual(buildImageOcrQuality(.96), { confidence: .96, level: "high", reviewRequired: true, warning: null });
  assert.equal(buildImageOcrQuality(.5).warning, OCR_LOW_CONFIDENCE_WARNING);
  assert.equal(buildImageOcrQuality(.8).warning, OCR_MEDIUM_CONFIDENCE_WARNING);
});

test("treats missing and invalid confidence as unknown", () => {
  for (const value of [undefined, null, NaN, -1, 2]) {
    assert.deepEqual(buildImageOcrQuality(value), { confidence: null, level: "unknown", reviewRequired: true, warning: OCR_UNKNOWN_CONFIDENCE_WARNING });
  }
  assert.equal(formatImageOcrQuality(buildImageOcrQuality(undefined)), "OCR confidence unavailable");
  assert.equal(formatImageOcrQuality(buildImageOcrQuality(.936)), "OCR confidence 94% · high");
});
