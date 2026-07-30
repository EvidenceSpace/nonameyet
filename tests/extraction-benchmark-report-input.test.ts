import assert from "node:assert/strict";
import test from "node:test";
import { EXTRACTION_EVALUATION_CORPUS } from "../evals/corpus.js";
import { BenchmarkValidationError, createExtractionBenchmarkReport } from "../src/ai/benchmark.js";
import { parseComparableExtractionBenchmarkReport } from "../src/ai/benchmark-report-input.js";
import { buildReferenceExtraction } from "../src/ai/evaluation.js";

function report() {
  return createExtractionBenchmarkReport({
    metadata: {
      provider: "provider",
      model: "model",
      modelVersion: "version",
      runAt: "2026-07-30T00:00:00.000Z",
      promptVersion: "prompt",
      contractVersion: "file-extraction.v1",
    },
    corpus: EXTRACTION_EVALUATION_CORPUS,
    outputs: EXTRACTION_EVALUATION_CORPUS.fixtures.map((fixture) => ({
      fixtureId: fixture.id,
      response: buildReferenceExtraction(fixture),
      latencyMs: 1,
    })),
  });
}

test("reconstructs only comparison-safe report fields", () => {
  const raw = { ...report(), ignored: { rawResponse: "must not propagate" } };
  const parsed = parseComparableExtractionBenchmarkReport(raw);
  assert.equal("ignored" in parsed, false);
  assert.equal(parsed.fixtures.length, EXTRACTION_EVALUATION_CORPUS.fixtures.length);
});

test("rejects unsupported, inconsistent, and malformed reports", () => {
  const valid = report();
  assert.throws(
    () => parseComparableExtractionBenchmarkReport({ ...valid, reportVersion: "unknown" }),
    /Unsupported benchmark report version/,
  );
  assert.throws(
    () => parseComparableExtractionBenchmarkReport({ ...valid, summary: { ...valid.summary, totalFixtures: 99 } }),
    /fixtures length must match/,
  );
  assert.throws(
    () => parseComparableExtractionBenchmarkReport({ ...valid, totals: { ...valid.totals, latencyMs: Number.NaN } }),
    /finite non-negative number/,
  );
  const duplicateFixtures = [...valid.fixtures];
  duplicateFixtures[1] = { ...duplicateFixtures[1]!, fixtureId: duplicateFixtures[0]!.fixtureId };
  assert.throws(
    () => parseComparableExtractionBenchmarkReport({ ...valid, fixtures: duplicateFixtures }),
    (error) => error instanceof BenchmarkValidationError && /Duplicate fixture report/.test(error.message),
  );
});
