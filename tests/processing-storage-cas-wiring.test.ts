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

test("unexpected ordinary exits become retryable failures only for the owned marker", () => {
  assert.match(ui, /let runMarkerSaved = false;/);
  assert.match(ui, /await saveProcessing\(runMarker\);\s*runMarkerSaved = true;/);
  assert.match(ui, /else if \(runMarkerSaved\) \{[\s\S]*?buildUnexpectedProcessingFailure\(runMarker\)[\s\S]*?saveProcessingIfCurrent\(runMarker, failure\)[\s\S]*?replaced \? failure\.message : PROCESSING_STALE_MESSAGE/);
  assert.doesNotMatch(ui, /if \(!preserveExisting\) throw error/);
});

test("storage failures stay visible without an unhandled final refresh", () => {
  assert.match(ui, /function showProcessingNotice\(fileId, message\)/);
  assert.match(ui, /else \{\s*showProcessingNotice\(file\.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE\);\s*\}/);
  assert.match(ui, /try \{\s*await refreshLatest\(\);\s*\} catch \{\s*showProcessingNotice\(file\.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE\);/);
});
