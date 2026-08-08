import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const processing = readFileSync(new URL("../web/pdf-processing.js", import.meta.url), "utf8");
const recovery = readFileSync(new URL("../web/pdf-failure-recovery.js", import.meta.url), "utf8");

test("checks a bounded PDF header before invoking PDF.js", () => {
  assert.match(processing, /PDF_HEADER_SCAN_BYTES = 1024/);
  assert.match(processing, /if \(!hasPdfHeader\(pdfData\)\) \{\s*throw processingError\("invalid_pdf_signature"/);
  assert.ok(processing.indexOf("hasPdfHeader(pdfData)") < processing.indexOf("pdfjs.getDocument"));
  assert.match(recovery, /invalid_pdf_signature/);
  assert.match(recovery, /retryable: false/);
});
