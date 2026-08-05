import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const storage = readFileSync(new URL("../web/storage.js", import.meta.url), "utf8");
const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");

test("compares and replaces processing state inside one read-write transaction", () => {
  assert.match(storage, /saveProcessingIfCurrent/);
  assert.match(storage, /db\.transaction\(\["processing", "cases"\], "readwrite"\)/);
  assert.match(storage, /processing\.get\(expected\.fileId\)/);
  assert.match(storage, /processingValuesMatch\(currentRequest\.result, expected\)/);
  assert.match(storage, /processing\.put\(replacement\)/);
});

test("mixed-PDF retry uses atomic replacement and surfaces stale results", () => {
  assert.match(ui, /saveProcessingIfCurrent\(preserveJob, result\)/);
  assert.match(ui, /if \(!replaced\) processingNotices\.set\(file\.id, MIXED_PDF_OCR_RETRY_STALE_MESSAGE\)/);
  assert.doesNotMatch(ui, /if \(outcome\.replaceExisting\) await saveProcessing\(result\)/);
});

test("ordinary processing commits only while its run marker remains current", () => {
  assert.match(ui, /let runMarker;/);
  assert.match(ui, /runMarker = \{[\s\S]*?status: "extracting"[\s\S]*?await saveProcessing\(runMarker\)/);
  assert.match(ui, /saveProcessingIfCurrent\(runMarker, result\)/);
  assert.match(ui, /if \(!replaced\) processingNotices\.set\(file\.id, PROCESSING_STALE_MESSAGE\)/);
  assert.doesNotMatch(ui, /else await saveProcessing\(result\)/);
});
