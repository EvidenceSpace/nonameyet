import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../web/processing-ui.js", import.meta.url), "utf8");
const pdf = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("persists classified PDF failure metadata", () => {
  assert.match(pdf, /const failure = classifyPdfFailure\(deadline\.timedOut\(\)/);
  assert.match(pdf, /failure: \{ code: failure\.code, retryable: failure\.retryable \}/);
});

test("does not offer an in-row retry for permanent PDF failures", () => {
  assert.match(ui, /job\?\.failure\?\.retryable === false/);
  assert.match(ui, /job\?\.failure\?\.retryable !== false/);
  assert.match(ui, /Needs attention/);
});
