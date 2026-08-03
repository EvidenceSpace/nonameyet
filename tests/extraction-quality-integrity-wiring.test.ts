import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../web/extraction-artifact.js", import.meta.url), "utf8");

test("routes optional OCR quality through artifact integrity validation", () => {
  assert.match(source, /isValidExtractionQuality/);
  assert.match(source, /artifact\.quality !== undefined/);
  assert.match(source, /buildImageOcrQuality\(confidence\)/);
  assert.match(source, /reviewRequired !== true/);
});
