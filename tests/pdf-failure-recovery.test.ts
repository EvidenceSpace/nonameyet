import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyPdfFailure,
  PDF_CORRUPT_MESSAGE,
  PDF_ENGINE_UNAVAILABLE_MESSAGE,
  PDF_PASSWORD_MESSAGE,
  PDF_TOO_MANY_PAGES_MESSAGE,
  PDF_TRANSIENT_MESSAGE,
} from "../web/pdf-failure-recovery.js";

function namedError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

test("classifies password-protected PDFs as permanent without exposing provider text", () => {
  assert.deepEqual(classifyPdfFailure(namedError("PasswordException", "Password required: internal detail")), {
    code: "password_protected", retryable: false, message: PDF_PASSWORD_MESSAGE,
  });
});

test("classifies malformed and truncated PDFs as permanent", () => {
  for (const error of [namedError("InvalidPDFException", "bad xref"), new Error("Unexpected end of file")]) {
    assert.deepEqual(classifyPdfFailure(error), { code: "corrupt_file", retryable: false, message: PDF_CORRUPT_MESSAGE });
  }
});

test("classifies page-limit and engine failures with actionable recovery", () => {
  assert.deepEqual(classifyPdfFailure(Object.assign(new Error("too many"), { code: "too_many_pages" })), {
    code: "too_many_pages", retryable: false, message: PDF_TOO_MANY_PAGES_MESSAGE,
  });
  assert.deepEqual(classifyPdfFailure(new Error("Unexpected PDF.js version 5; expected 4.")), {
    code: "adapter_unavailable", retryable: false, message: PDF_ENGINE_UNAVAILABLE_MESSAGE,
  });
});

test("keeps unknown failures retryable but replaces raw internal details", () => {
  assert.deepEqual(classifyPdfFailure(new Error("worker internal address 0x123")), {
    code: "transient_error", retryable: true, message: PDF_TRANSIENT_MESSAGE,
  });
});
