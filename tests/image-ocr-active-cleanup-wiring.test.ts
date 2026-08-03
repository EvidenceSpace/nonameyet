import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../web/image-ocr.js", import.meta.url), "utf8");

test("wires timeout cancellation into runtime and detector cleanup", () => {
  assert.match(source, /const workController = new AbortController\(\)/);
  assert.match(source, /workController\.abort\(\)/);
  assert.match(source, /operation\(workController\.signal\)/);
  assert.match(source, /abortable\(new scope\.TextDetector\(\)\.detect\(bitmap\), signal\)/);
  assert.match(source, /finally\s*\{\s*bitmap\.close\?\.\(\)/);
});
