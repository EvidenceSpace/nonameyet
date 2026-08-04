import assert from "node:assert/strict";
import test from "node:test";
import { buildExtractionArtifact } from "../src/processing/normalize.js";

function build(warnings: unknown) {
  return buildExtractionArtifact({
    fileId: "file",
    fileHash: "hash",
    adapterId: "adapter",
    adapterVersion: "1",
    pages: [{ pageNumber: 1, text: "Invoice" }],
    warnings: warnings as string[],
    extractedAt: "2026-08-04T00:00:00.000Z",
  });
}

test("shared artifact boundary preserves bounded extraction warnings", () => {
  assert.deepEqual(build(["Review this text."]).warnings, ["Review this text."]);
});

test("shared artifact boundary rejects malformed extraction warnings", () => {
  for (const warnings of [null, [""], ["   "], [42]]) {
    assert.throws(() => build(warnings), (error: any) => error.code === "corrupt_file");
  }
});

test("shared artifact boundary rejects excessive extraction warnings", () => {
  for (const warnings of [
    Array.from({ length: 101 }, () => "warning"),
    ["x".repeat(1_001)],
    Array.from({ length: 21 }, () => "x".repeat(1_000)),
  ]) {
    assert.throws(() => build(warnings), (error: any) => error.code === "output_too_large");
  }
});
