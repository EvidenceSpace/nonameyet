import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");

test("enforces byte, text, and deadline boundaries in browser PDF processing", () => {
  assert.match(source, /MAX_PDF_BYTES = 20 \* 1024 \* 1024/);
  assert.match(source, /MAX_PDF_TEXT_CHARACTERS = 2_000_000/);
  assert.match(source, /PDF_PROCESSING_TIMEOUT_MS = 60_000/);
  assert.match(source, /originalBytes\.byteLength > maxBytes/);
  assert.match(source, /extractedCharacters > maxTextCharacters/);
  assert.match(source, /deadline\.timedOut\(\)/);
  assert.match(source, /destroyTask/);
});
