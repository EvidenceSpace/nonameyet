import { BenchmarkValidationError } from "./benchmark.js";

export const EXTRACTION_BENCHMARK_COMPARISON_VERSION = "extraction-benchmark-comparison.v1";

export interface ComparableExtractionBenchmarkReport {
  reportVersion: string;
  metadata: {
    provider: string;
    model: string;
    modelVersion: string;
    corpusVersion: string;
    promptVersion: string;
    contractVersion: "file-extraction.v1";
  };
  qualityGatePassed: boolean;
  summary: {
    precision: number;
    recall: number;
    falsePositives: number;
    passedFixtures: number;
    totalFixtures: number;
  };
  totals: {
    latencyMs: number;
    costUsd?: number;
  };
  fixtures: ReadonlyArray<{
    fixtureId: string;
    evaluation: { forbiddenValuesFound: ReadonlyArray<string> };
  }>;
}

export interface ModelComparisonThresholds {
  minimumPrecision: number;
  minimumRecall: number;
  maximumFalsePositives: number;
  maximumForbiddenValues: number;
  requireEveryFixturePassed: boolean;
}

export interface ModelComparisonCandidate {
  modelKey: string;
  provider: string;
  model: string;
  modelVersion: string;
  eligible: boolean;
  ineligibilityReasons: string[];
  precision: number;
  recall: number;
  falsePositives: number;
  forbiddenValues: number;
  passedFixtures: number;
  totalFixtures: number;
  totalLatencyMs: number;
  totalCostUsd?: number;
}

export interface ExtractionBenchmarkComparison {
  comparisonVersion: typeof EXTRACTION_BENCHMARK_COMPARISON_VERSION;
  scope: {
    corpusVersion: string;
    promptVersion: string;
    contractVersion: "file-extraction.v1";
  };
  thresholds: ModelComparisonThresholds;
  candidates: ModelComparisonCandidate[];
  eligibleRanking: string[];
}

export const DEFAULT_MODEL_COMPARISON_THRESHOLDS: Readonly<ModelComparisonThresholds> = Object.freeze({
  minimumPrecision: 0.95,
  minimumRecall: 0.9,
  maximumFalsePositives: 0,
  maximumForbiddenValues: 0,
  requireEveryFixturePassed: true,
});

function validateRate(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new BenchmarkValidationError(`${field} must be between 0 and 1.`);
  }
}

function validateCount(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new BenchmarkValidationError(`${field} must be a non-negative integer.`);
  }
}

function modelKey(report: ComparableExtractionBenchmarkReport): string {
  return `${report.metadata.provider}:${report.metadata.model}:${report.metadata.modelVersion}`;
}

function countForbiddenValues(report: ComparableExtractionBenchmarkReport): number {
  return report.fixtures.reduce(
    (total, fixture) => total + fixture.evaluation.forbiddenValuesFound.length,
    0,
  );
}

function compareEligibleCandidates(left: ModelComparisonCandidate, right: ModelComparisonCandidate): number {
  if (left.forbiddenValues !== right.forbiddenValues) return left.forbiddenValues - right.forbiddenValues;
  if (left.falsePositives !== right.falsePositives) return left.falsePositives - right.falsePositives;
  if (left.precision !== right.precision) return right.precision - left.precision;
  if (left.recall !== right.recall) return right.recall - left.recall;
  const leftHasCost = left.totalCostUsd !== undefined;
  const rightHasCost = right.totalCostUsd !== undefined;
  if (leftHasCost !== rightHasCost) return leftHasCost ? -1 : 1;
  if (left.totalCostUsd !== right.totalCostUsd) return (left.totalCostUsd ?? 0) - (right.totalCostUsd ?? 0);
  if (left.totalLatencyMs !== right.totalLatencyMs) return left.totalLatencyMs - right.totalLatencyMs;
  return left.modelKey.localeCompare(right.modelKey);
}

/** Compares compatible reports without changing runtime model configuration. */
export function compareExtractionBenchmarkReports(args: {
  reports: ReadonlyArray<ComparableExtractionBenchmarkReport>;
  thresholds?: ModelComparisonThresholds;
}): ExtractionBenchmarkComparison {
  if (args.reports.length < 2) throw new BenchmarkValidationError("At least two benchmark reports are required.");
  const thresholds = { ...(args.thresholds ?? DEFAULT_MODEL_COMPARISON_THRESHOLDS) };
  validateRate(thresholds.minimumPrecision, "minimumPrecision");
  validateRate(thresholds.minimumRecall, "minimumRecall");
  validateCount(thresholds.maximumFalsePositives, "maximumFalsePositives");
  validateCount(thresholds.maximumForbiddenValues, "maximumForbiddenValues");

  const baseline = args.reports[0]!;
  const seenModels = new Set<string>();
  const candidates = args.reports.map((report): ModelComparisonCandidate => {
    if (report.reportVersion !== baseline.reportVersion) throw new BenchmarkValidationError("Benchmark report versions do not match.");
    if (report.metadata.corpusVersion !== baseline.metadata.corpusVersion) throw new BenchmarkValidationError("Benchmark corpus versions do not match.");
    if (report.metadata.promptVersion !== baseline.metadata.promptVersion) throw new BenchmarkValidationError("Benchmark prompt versions do not match.");
    if (report.metadata.contractVersion !== baseline.metadata.contractVersion) throw new BenchmarkValidationError("Benchmark contract versions do not match.");

    const key = modelKey(report);
    if (seenModels.has(key)) throw new BenchmarkValidationError(`Duplicate model report: ${key}.`);
    seenModels.add(key);

    const forbiddenValues = countForbiddenValues(report);
    const reasons: string[] = [];
    if (report.summary.precision < thresholds.minimumPrecision) reasons.push("precision_below_minimum");
    if (report.summary.recall < thresholds.minimumRecall) reasons.push("recall_below_minimum");
    if (report.summary.falsePositives > thresholds.maximumFalsePositives) reasons.push("too_many_false_positives");
    if (forbiddenValues > thresholds.maximumForbiddenValues) reasons.push("prohibited_conclusions_present");
    if (thresholds.requireEveryFixturePassed && !report.qualityGatePassed) reasons.push("fixture_quality_gate_failed");

    return {
      modelKey: key,
      provider: report.metadata.provider,
      model: report.metadata.model,
      modelVersion: report.metadata.modelVersion,
      eligible: reasons.length === 0,
      ineligibilityReasons: reasons,
      precision: report.summary.precision,
      recall: report.summary.recall,
      falsePositives: report.summary.falsePositives,
      forbiddenValues,
      passedFixtures: report.summary.passedFixtures,
      totalFixtures: report.summary.totalFixtures,
      totalLatencyMs: report.totals.latencyMs,
      ...(report.totals.costUsd === undefined ? {} : { totalCostUsd: report.totals.costUsd }),
    };
  });

  return {
    comparisonVersion: EXTRACTION_BENCHMARK_COMPARISON_VERSION,
    scope: {
      corpusVersion: baseline.metadata.corpusVersion,
      promptVersion: baseline.metadata.promptVersion,
      contractVersion: baseline.metadata.contractVersion,
    },
    thresholds,
    candidates,
    eligibleRanking: candidates.filter((candidate) => candidate.eligible).sort(compareEligibleCandidates).map((candidate) => candidate.modelKey),
  };
}
