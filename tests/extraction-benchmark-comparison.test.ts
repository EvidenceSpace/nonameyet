import assert from "node:assert/strict";
import test from "node:test";
import { EXTRACTION_EVALUATION_CORPUS } from "../evals/corpus.js";
import {
  compareExtractionBenchmarkReports,
  DEFAULT_MODEL_COMPARISON_THRESHOLDS,
} from "../src/ai/benchmark-comparison.js";
import { BenchmarkValidationError, createExtractionBenchmarkReport } from "../src/ai/benchmark.js";
import { buildReferenceExtraction } from "../src/ai/evaluation.js";

function buildReport(provider: string, costUsd?: number) {
  return createExtractionBenchmarkReport({
    metadata: {
      provider,
      model: "synthetic-model",
      modelVersion: "2026-07-30",
      runAt: "2026-07-30T00:00:00.000Z",
      promptVersion: "analysis-service.v1",
      contractVersion: "file-extraction.v1",
    },
    corpus: EXTRACTION_EVALUATION_CORPUS,
    outputs: EXTRACTION_EVALUATION_CORPUS.fixtures.map((fixture, index) => ({
      fixtureId: fixture.id,
      response: buildReferenceExtraction(fixture),
      latencyMs: 10 + index,
      ...(costUsd === undefined ? {} : { costUsd }),
    })),
  });
}

test("filters for safety before ordering eligible models by cost", () => {
  const unknownCost = buildReport("unknown-cost");
  const higherCost = buildReport("higher-cost", 0.02);
  const lowerCost = buildReport("lower-cost", 0.01);
  const comparison = compareExtractionBenchmarkReports({
    reports: [unknownCost, higherCost, lowerCost],
  });
  assert.deepEqual(comparison.thresholds, DEFAULT_MODEL_COMPARISON_THRESHOLDS);
  assert.deepEqual(comparison.eligibleRanking, [
    "lower-cost:synthetic-model:2026-07-30",
    "higher-cost:synthetic-model:2026-07-30",
    "unknown-cost:synthetic-model:2026-07-30",
  ]);
});

test("makes a grounded prohibited conclusion ineligible", () => {
  const safe = buildReport("safe");
  const unsafe = buildReport("unsafe");
  const target = EXTRACTION_EVALUATION_CORPUS.fixtures.find((fixture) => fixture.id === "negative-payment-evidence")!;
  const unsafeFixture = unsafe.fixtures.find((fixture) => fixture.fixtureId === target.id)!;
  unsafeFixture.evaluation = {
    ...unsafeFixture.evaluation,
    passed: false,
    falsePositives: 1,
    precision: 0,
    forbiddenValuesFound: ["Paid"],
  };
  unsafe.summary = {
    ...unsafe.summary,
    falsePositives: 1,
    precision: 0.95,
    passedFixtures: unsafe.summary.passedFixtures - 1,
  };
  unsafe.qualityGatePassed = false;

  const comparison = compareExtractionBenchmarkReports({ reports: [safe, unsafe] });
  const candidate = comparison.candidates.find((item) => item.provider === "unsafe")!;
  assert.equal(candidate.eligible, false);
  assert.deepEqual(candidate.ineligibilityReasons, [
    "too_many_false_positives",
    "prohibited_conclusions_present",
    "fixture_quality_gate_failed",
  ]);
  assert.deepEqual(comparison.eligibleRanking, ["safe:synthetic-model:2026-07-30"]);
});

test("rejects apples-to-oranges reports and duplicate model identities", () => {
  const first = buildReport("first");
  const incompatible = buildReport("second");
  incompatible.metadata.corpusVersion = "different-corpus";
  assert.throws(
    () => compareExtractionBenchmarkReports({ reports: [first, incompatible] }),
    /corpus versions do not match/,
  );
  assert.throws(
    () => compareExtractionBenchmarkReports({ reports: [first, first] }),
    /Duplicate model report/,
  );
});

test("rejects invalid comparison thresholds", () => {
  assert.throws(
    () => compareExtractionBenchmarkReports({
      reports: [buildReport("first"), buildReport("second")],
      thresholds: { ...DEFAULT_MODEL_COMPARISON_THRESHOLDS, minimumPrecision: 1.1 },
    }),
    (error) => error instanceof BenchmarkValidationError && /minimumPrecision/.test(error.message),
  );
});
