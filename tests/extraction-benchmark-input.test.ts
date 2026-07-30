import assert from "node:assert/strict";
import test from "node:test";
import { BenchmarkValidationError } from "../src/ai/benchmark.js";
import { parseExtractionBenchmarkInput } from "../src/ai/benchmark-input.js";

const validInput = {
  metadata: {
    provider: "provider",
    model: "model",
    modelVersion: "version",
    runAt: "2026-07-30T00:00:00.000Z",
    promptVersion: "prompt-v1",
    contractVersion: "file-extraction.v1",
  },
  outputs: [
    {
      fixtureId: "invoice-basic",
      response: { contractVersion: "file-extraction.v1" },
      latencyMs: 12,
      inputTokens: 20,
      outputTokens: 10,
      costUsd: 0.001,
    },
  ],
};

test("parses a captured benchmark envelope without changing the response", () => {
  const parsed = parseExtractionBenchmarkInput(validInput);
  assert.equal(parsed.metadata.contractVersion, "file-extraction.v1");
  assert.equal(parsed.outputs[0]!.response, validInput.outputs[0]!.response);
  assert.equal(parsed.outputs[0]!.costUsd, 0.001);
});

test("rejects malformed envelopes before report generation", () => {
  assert.throws(() => parseExtractionBenchmarkInput(null), BenchmarkValidationError);
  assert.throws(
    () => parseExtractionBenchmarkInput({ ...validInput, metadata: { ...validInput.metadata, contractVersion: "unknown" } }),
    /Unsupported extraction contract version/,
  );
  assert.throws(
    () => parseExtractionBenchmarkInput({ ...validInput, outputs: [{ fixtureId: "invoice-basic", latencyMs: 1 }] }),
    /response is required/,
  );
  assert.throws(
    () => parseExtractionBenchmarkInput({ ...validInput, outputs: [{ ...validInput.outputs[0], inputTokens: "20" }] }),
    /inputTokens must be a number/,
  );
});

test("caps untrusted captured records before allocating a report", () => {
  assert.throws(
    () => parseExtractionBenchmarkInput({ ...validInput, outputs: Array.from({ length: 1_001 }, () => validInput.outputs[0]) }),
    /1,000-record safety limit/,
  );
});
