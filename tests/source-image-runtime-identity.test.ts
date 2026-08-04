import assert from "node:assert/strict";
import test from "node:test";
import { createImageOcrAdapter } from "../src/processing/adapters/image-ocr.js";

test("invalid OCR runtime identity is rejected before provenance is created", () => {
  const recognize = async () => ({ text: "Invoice", width: 10, height: 10 });
  for (const value of ["", " leading", "trailing ", "contains/slash", "x".repeat(101)]) {
    assert.throws(
      () => createImageOcrAdapter({ id: value, version: "1", recognize } as any),
      (error: any) => error.code === "adapter_unavailable" && error.retryable === false,
    );
    assert.throws(
      () => createImageOcrAdapter({ id: "runtime", version: value, recognize } as any),
      (error: any) => error.code === "adapter_unavailable" && error.retryable === false,
    );
  }
  assert.throws(
    () => createImageOcrAdapter({ id: "runtime", version: "1" } as any),
    (error: any) => error.code === "adapter_unavailable" && error.retryable === false,
  );
});
