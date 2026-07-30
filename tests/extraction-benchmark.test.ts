import assert from "node:assert/strict";
import test from "node:test";
import { EXTENDED_SYNTHETIC_EXTRACTION_CASES } from "../evals/extended-synthetic-extraction-cases.js";
import { SYNTHETIC_EXTRACTION_CASES } from "../evals/synthetic-extraction-cases.js";
import { BenchmarkValidationError, createExtractionBenchmarkReport } from "../src/ai/benchmark.js";
import { buildReferenceExtraction } from "../src/ai/evaluation.js";

const fixtures = [...SYNTHETIC_EXTRACTION_CASES, ...EXTENDED_SYNTHETIC_EXTRACTION_CASES];
const metadata = {
  provider: "offline-reference",
  model: "fixture-builder",
  modelVersion: "1",
  runAt: "2026-07-30T00:00:00.000Z",
  corpusVersion: "synthetic-2026-07-30",
  promptVersion: "analysis-service.v1",
  contractVersion: "file-extraction.v1" as const,
};

function referenceOutputs() {
  return fixtures.map((fixture, index) => ({
    fixtureId: fixture.id,
    response: buildReferenceExtraction(fixture),
    latencyMs: index + 1,
    inputTokens: 100 + index,
    outputTokens: 20 + index,
    costUsd: 0,
  }));
}

test("builds a complete reproducible report from captured outputs", () => {
  const outputs = referenceOutputs();
  const report = createExtractionBenchmarkReport({ metadata, fixtures, outputs });
  assert.equal(report.reportVersion, "extraction-benchmark.v1");
  assert.equal(report.fixtureCount, fixtures.length);
  assert.equal(report.qualityGatePassed, true);
  assert.equal(report.summary.precision, 1);
  assert.equal(report.summary.recall, 1);
  assert.equal(report.totals.latencyMs, outputs.reduce((total, output) => total + output.latencyMs, 0));
  assert.equal(report.totals.inputTokens, outputs.reduce((total, output) => total + output.inputTokens, 0));
  assert.equal(report.totals.costUsd, 0);
});

test("rejects incomplete runs so weak fixtures cannot be omitted", () => {
  assert.throws(
    () => createExtractionBenchmarkReport({ metadata, fixtures, outputs: referenceOutputs().slice(1) }),
    (error) => error instanceof BenchmarkValidationError && /Missing fixture outputs/.test(error.message),
  );
});

test("rejects duplicate, unexpected, and invalid metric records", () => {
  const outputs = referenceOutputs();
  assert.throws(
    () => createExtractionBenchmarkReport({ metadata, fixtures, outputs: [...outputs, outputs[0]!] }),
    /Duplicate fixture output/,
  );
  assert.throws(
    () => createExtractionBenchmarkReport({ metadata, fixtures, outputs: [...outputs, { ...outputs[0]!, fixtureId: "invented" }] }),
    /Unexpected fixture output/,
  );
  assert.throws(
    () => createExtractionBenchmarkReport({ metadata, fixtures, outputs: outputs.map((output, index) => index === 0 ? { ...output, latencyMs: -1 } : output) }),
    /latencyMs must be a non-negative number/,
  );
});

test("preserves semantic failures instead of hiding grounded false conclusions", () => {
  const target = fixtures.find((fixture) => fixture.id === "negative-payment-evidence")!;
  const outputs = referenceOutputs();
  const output = outputs.find((item) => item.fixtureId === target.id)!;
  output.response = {
    ...buildReferenceExtraction(target),
    candidates: [{ kind: "fact", label: "Payment status", value: "Paid", confidence: 0.99, locator: { kind: "whole_file", quote: "Bank statement shows no matching payment" } }],
  };
  const report = createExtractionBenchmarkReport({ metadata, fixtures, outputs });
  const result = report.fixtures.find((fixture) => fixture.fixtureId === target.id)!.evaluation;
  assert.equal(report.qualityGatePassed, false);
  assert.equal(result.falsePositives, 1);
  assert.deepEqual(result.forbiddenValuesFound, ["Paid"]);
});
