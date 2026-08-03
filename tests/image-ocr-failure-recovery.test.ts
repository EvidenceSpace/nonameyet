import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyImageOcrFailure,
  IMAGE_CORRUPT_MESSAGE,
  IMAGE_EMPTY_TEXT_MESSAGE,
  IMAGE_TIMEOUT_MESSAGE,
  IMAGE_TRANSIENT_MESSAGE,
} from "../web/image-ocr-failure-recovery.js";

test("classifies permanent image failures without exposing runtime details", () => {
  const corrupt = Object.assign(new Error("decoder pointer 0xdead"), { code: "corrupt_file" });
  assert.deepEqual(classifyImageOcrFailure(corrupt), { code: "corrupt_file", retryable: false, message: IMAGE_CORRUPT_MESSAGE });
  assert.equal(IMAGE_CORRUPT_MESSAGE.includes("0xdead"), false);
  assert.deepEqual(classifyImageOcrFailure({ code: "empty_text" }), { code: "empty_text", retryable: false, message: IMAGE_EMPTY_TEXT_MESSAGE });
});

test("keeps timeout and unknown failures safely retryable", () => {
  assert.deepEqual(classifyImageOcrFailure({ code: "ocr_timeout" }), { code: "ocr_timeout", retryable: true, message: IMAGE_TIMEOUT_MESSAGE });
  assert.deepEqual(classifyImageOcrFailure(new Error("private engine stack")), { code: "transient_error", retryable: true, message: IMAGE_TRANSIENT_MESSAGE });
});
