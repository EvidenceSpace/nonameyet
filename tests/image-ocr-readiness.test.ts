import assert from "node:assert/strict";
import test from "node:test";
import { canStartImageOcr, inspectImageOcrReadiness, IMAGE_OCR_UNAVAILABLE_MESSAGE } from "../web/image-ocr-readiness.js";

test("requires both on-device text detection and image decoding", () => {
  assert.equal(inspectImageOcrReadiness({ TextDetector: class {}, createImageBitmap() {} } as any).available, true);
  const missingDetector = inspectImageOcrReadiness({ createImageBitmap() {} } as any);
  assert.equal(missingDetector.available, false);
  assert.deepEqual(missingDetector.missing, ["text_detector"]);
  assert.equal(missingDetector.message, IMAGE_OCR_UNAVAILABLE_MESSAGE);
  assert.deepEqual(inspectImageOcrReadiness({} as any).missing, ["text_detector", "image_decoder"]);
});

test("blocks unavailable processing but allows a retry after capabilities appear", () => {
  const base = { fileType: "image/png", jobStatus: undefined, failureCode: undefined };
  assert.equal(canStartImageOcr({ ...base, readiness: { available: false } }), false);
  assert.equal(canStartImageOcr({ ...base, jobStatus: "failed", failureCode: "adapter_unavailable", readiness: { available: true } }), true);
});

test("permits supported images only when the runtime is ready", () => {
  const readiness = { available: true };
  assert.equal(canStartImageOcr({ fileType: "image/jpeg", jobStatus: undefined, failureCode: undefined, readiness }), true);
  assert.equal(canStartImageOcr({ fileType: "image/webp", jobStatus: "cancelled", failureCode: "cancelled", readiness }), true);
  assert.equal(canStartImageOcr({ fileType: "application/pdf", jobStatus: undefined, failureCode: undefined, readiness }), false);
  assert.equal(canStartImageOcr({ fileType: "image/png", jobStatus: "ready_for_ai", failureCode: undefined, readiness }), false);
});
