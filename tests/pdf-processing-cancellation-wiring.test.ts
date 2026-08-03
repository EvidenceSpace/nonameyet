import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("passes the active workspace cancellation signal into PDF extraction", () => {
  assert.match(ui, /processPdf\(file, \{ signal: controller\.signal \}\)/);
});

test("PDF processing races loading and page extraction against cancellation", () => {
  assert.match(pdf, /abortable\(task\.promise, signal, destroyTask\)/);
  assert.match(pdf, /abortable\(page\.getTextContent/);
  assert.match(pdf, /status: "cancelled"/);
  assert.match(pdf, /failure: \{ code: "cancelled", retryable: false \}/);
});
