import {
  type ComparableExtractionBenchmarkReport,
} from "./benchmark-comparison.js";
import {
  BenchmarkValidationError,
  EXTRACTION_BENCHMARK_REPORT_VERSION,
} from "./benchmark.js";

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BenchmarkValidationError(`${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BenchmarkValidationError(`${field} must be a non-empty string.`);
  }
  return value;
}

function finiteNonNegative(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new BenchmarkValidationError(`${field} must be a finite non-negative number.`);
  }
  return value;
}

function count(value: unknown, field: string): number {
  const parsed = finiteNonNegative(value, field);
  if (!Number.isInteger(parsed)) throw new BenchmarkValidationError(`${field} must be an integer.`);
  return parsed;
}

function rate(value: unknown, field: string): number {
  const parsed = finiteNonNegative(value, field);
  if (parsed > 1) throw new BenchmarkValidationError(`${field} must not exceed 1.`);
  return parsed;
}

/** Reconstructs only the fields the comparison engine is allowed to consume. */
export function parseComparableExtractionBenchmarkReport(value: unknown): ComparableExtractionBenchmarkReport {
  const root = record(value, "report");
  if (root.reportVersion !== EXTRACTION_BENCHMARK_REPORT_VERSION) {
    throw new BenchmarkValidationError("Unsupported benchmark report version.");
  }
  const metadata = record(root.metadata, "metadata");
  const contractVersion = text(metadata.contractVersion, "metadata.contractVersion");
  if (contractVersion !== "file-extraction.v1") throw new BenchmarkValidationError("Unsupported extraction contract version.");
  const summary = record(root.summary, "summary");
  const totals = record(root.totals, "totals");
  if (typeof root.qualityGatePassed !== "boolean") throw new BenchmarkValidationError("qualityGatePassed must be a boolean.");
  if (!Array.isArray(root.fixtures)) throw new BenchmarkValidationError("fixtures must be an array.");
  if (root.fixtures.length > 1_000) throw new BenchmarkValidationError("fixtures exceeds the 1,000-record safety limit.");

  const totalFixtures = count(summary.totalFixtures, "summary.totalFixtures");
  const passedFixtures = count(summary.passedFixtures, "summary.passedFixtures");
  if (passedFixtures > totalFixtures) throw new BenchmarkValidationError("passedFixtures cannot exceed totalFixtures.");
  if (root.fixtures.length !== totalFixtures) throw new BenchmarkValidationError("fixtures length must match summary.totalFixtures.");

  const seenFixtureIds = new Set<string>();
  const fixtures = root.fixtures.map((rawFixture, index) => {
    const fixture = record(rawFixture, `fixtures[${index}]`);
    const fixtureId = text(fixture.fixtureId, `fixtures[${index}].fixtureId`);
    if (seenFixtureIds.has(fixtureId)) throw new BenchmarkValidationError(`Duplicate fixture report: ${fixtureId}.`);
    seenFixtureIds.add(fixtureId);
    const evaluation = record(fixture.evaluation, `fixtures[${index}].evaluation`);
    if (!Array.isArray(evaluation.forbiddenValuesFound) || evaluation.forbiddenValuesFound.some((item) => typeof item !== "string")) {
      throw new BenchmarkValidationError(`fixtures[${index}].evaluation.forbiddenValuesFound must be a string array.`);
    }
    return {
      fixtureId,
      evaluation: { forbiddenValuesFound: [...evaluation.forbiddenValuesFound] as string[] },
    };
  });

  const costUsd = totals.costUsd === undefined ? undefined : finiteNonNegative(totals.costUsd, "totals.costUsd");
  return {
    reportVersion: EXTRACTION_BENCHMARK_REPORT_VERSION,
    metadata: {
      provider: text(metadata.provider, "metadata.provider"),
      model: text(metadata.model, "metadata.model"),
      modelVersion: text(metadata.modelVersion, "metadata.modelVersion"),
      corpusVersion: text(metadata.corpusVersion, "metadata.corpusVersion"),
      promptVersion: text(metadata.promptVersion, "metadata.promptVersion"),
      contractVersion,
    },
    qualityGatePassed: root.qualityGatePassed,
    summary: {
      precision: rate(summary.precision, "summary.precision"),
      recall: rate(summary.recall, "summary.recall"),
      falsePositives: count(summary.falsePositives, "summary.falsePositives"),
      passedFixtures,
      totalFixtures,
    },
    totals: {
      latencyMs: finiteNonNegative(totals.latencyMs, "totals.latencyMs"),
      ...(costUsd === undefined ? {} : { costUsd }),
    },
    fixtures,
  };
}
