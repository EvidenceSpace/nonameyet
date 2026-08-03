import assert from "node:assert/strict";
import test from "node:test";
import { isValidExtractionArtifact, isValidExtractionQuality } from "../web/extraction-artifact.js";
import { buildImageOcrQuality } from "../web/image-ocr-quality.js";

const artifact = {
  adapterId: "local-image-ocr",
  adapterVersion: "1.0.0+test-1",
  text: "Invoice 1042",
  pages: [{ pageNumber: 1, text: "Invoice 1042", start: 0, end: 12 }],
  warnings: [],
  quality: buildImageOcrQuality(.95),
};

test("accepts internally consistent review quality", () => {
  for (const confidence of [null, 0, .69, .7, .89, .9, 1]) assert.equal(isValidExtractionQuality(buildImageOcrQuality(confidence)), true);
  assert.equal(isValidExtractionArtifact(artifact), true);
});

test("rejects misleading or malformed quality metadata", () => {
  const invalid = [
    null,
    [],
    { ...artifact.quality, reviewRequired: false },
    { ...artifact.quality, confidence: NaN },
    { ...artifact.quality, confidence: -1 },
    { ...artifact.quality, confidence: 2 },
    { ...artifact.quality, confidence: .2, level: "high" },
    { ...buildImageOcrQuality(.2), warning: null },
    { ...buildImageOcrQuality(.95), warning: "No review needed." },
    { ...buildImageOcrQuality(null), level: "high" },
  ];
  for (const quality of invalid) {
    assert.equal(isValidExtractionQuality(quality), false);
    assert.equal(isValidExtractionArtifact({ ...artifact, quality }), false);
  }
});

test("keeps pre-quality PDF and image artifacts compatible", () => {
  const { quality, ...legacy } = artifact;
  assert.equal(isValidExtractionArtifact(legacy), true);
});
