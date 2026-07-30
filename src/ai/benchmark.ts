import {
  evaluateExtractionFixture,
  summarizeExtractionEvaluations,
  type ExtractionEvaluationFixture,
  type ExtractionEvaluationResult,
} from "./evaluation.js";

export const EXTRACTION_BENCHMARK_REPORT_VERSION = "extraction-benchmark.v1";

export interface ExtractionBenchmarkMetadata {
  provider: string;
  model: string;
  modelVersion: string;
  runAt: string;
  corpusVersion: string;
  promptVersion: string;
  contractVersion: "file-extraction.v1";
}

export interface CapturedExtractionOutput {
  fixtureId: string;
  response: unknown;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export interface ExtractionBenchmarkFixtureResult {
  fixtureId: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  evaluation: ExtractionEvaluationResult;
}

export interface ExtractionBenchmarkReport {
  reportVersion: typeof EXTRACTION_BENCHMARK_REPORT_VERSION;
  metadata: ExtractionBenchmarkMetadata;
  fixtureCount: number;
  qualityGatePassed: boolean;
  summary: ReturnType<typeof summarizeExtractionEvaluations>;
  totals: {
    latencyMs: number;
    inputTokens?: number;
    outputTokens?: number;
    costUsd?: number;
  };
  fixtures: ExtractionBenchmarkFixtureResult[];
}

export class BenchmarkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BenchmarkValidationError";
  }
}

function requireText(value: string, field: string): void {
  if (!value.trim()) throw new BenchmarkValidationError(`${field} is required.`);
}

function requireMetric(value: number | undefined, field: string, integer = false): void {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    throw new BenchmarkValidationError(`${field} must be a non-negative${integer ? " integer" : " number"}.`);
  }
}

function optionalSum(outputs: CapturedExtractionOutput[], field: "inputTokens" | "outputTokens" | "costUsd") {
  if (!outputs.some((output) => output[field] !== undefined)) return undefined;
  return outputs.reduce((total, output) => total + (output[field] ?? 0), 0);
}

/**
 * Builds a comparable report from already-captured model outputs. This function
 * performs no provider calls and rejects partial, duplicated, or padded runs.
 */
export function createExtractionBenchmarkReport(args: {
  metadata: ExtractionBenchmarkMetadata;
  fixtures: ExtractionEvaluationFixture[];
  outputs: CapturedExtractionOutput[];
}): ExtractionBenchmarkReport {
  requireText(args.metadata.provider, "provider");
  requireText(args.metadata.model, "model");
  requireText(args.metadata.modelVersion, "modelVersion");
  requireText(args.metadata.corpusVersion, "corpusVersion");
  requireText(args.metadata.promptVersion, "promptVersion");
  if (args.metadata.contractVersion !== "file-extraction.v1") {
    throw new BenchmarkValidationError("Unsupported extraction contract version.");
  }
  if (Number.isNaN(Date.parse(args.metadata.runAt))) {
    throw new BenchmarkValidationError("runAt must be an ISO-compatible timestamp.");
  }
  if (args.fixtures.length === 0) throw new BenchmarkValidationError("At least one fixture is required.");

  const fixtureIds = new Set<string>();
  for (const fixture of args.fixtures) {
    if (fixtureIds.has(fixture.id)) throw new BenchmarkValidationError(`Duplicate fixture definition: ${fixture.id}.`);
    fixtureIds.add(fixture.id);
  }

  const outputsByFixture = new Map<string, CapturedExtractionOutput>();
  for (const output of args.outputs) {
    if (!fixtureIds.has(output.fixtureId)) throw new BenchmarkValidationError(`Unexpected fixture output: ${output.fixtureId}.`);
    if (outputsByFixture.has(output.fixtureId)) throw new BenchmarkValidationError(`Duplicate fixture output: ${output.fixtureId}.`);
    requireMetric(output.latencyMs, `${output.fixtureId}.latencyMs`);
    requireMetric(output.inputTokens, `${output.fixtureId}.inputTokens`, true);
    requireMetric(output.outputTokens, `${output.fixtureId}.outputTokens`, true);
    requireMetric(output.costUsd, `${output.fixtureId}.costUsd`);
    outputsByFixture.set(output.fixtureId, output);
  }

  const missing = args.fixtures.filter((fixture) => !outputsByFixture.has(fixture.id)).map((fixture) => fixture.id);
  if (missing.length > 0) throw new BenchmarkValidationError(`Missing fixture outputs: ${missing.join(", ")}.`);

  const fixtures = args.fixtures.map((fixture): ExtractionBenchmarkFixtureResult => {
    const output = outputsByFixture.get(fixture.id)!;
    return {
      fixtureId: fixture.id,
      latencyMs: output.latencyMs,
      ...(output.inputTokens === undefined ? {} : { inputTokens: output.inputTokens }),
      ...(output.outputTokens === undefined ? {} : { outputTokens: output.outputTokens }),
      ...(output.costUsd === undefined ? {} : { costUsd: output.costUsd }),
      evaluation: evaluateExtractionFixture(fixture, output.response),
    };
  });
  const evaluations = fixtures.map((fixture) => fixture.evaluation);
  const totalInputTokens = optionalSum(args.outputs, "inputTokens");
  const totalOutputTokens = optionalSum(args.outputs, "outputTokens");
  const totalCostUsd = optionalSum(args.outputs, "costUsd");

  return {
    reportVersion: EXTRACTION_BENCHMARK_REPORT_VERSION,
    metadata: { ...args.metadata },
    fixtureCount: fixtures.length,
    qualityGatePassed: evaluations.every((evaluation) => evaluation.passed),
    summary: summarizeExtractionEvaluations(evaluations),
    totals: {
      latencyMs: args.outputs.reduce((total, output) => total + output.latencyMs, 0),
      ...(totalInputTokens === undefined ? {} : { inputTokens: totalInputTokens }),
      ...(totalOutputTokens === undefined ? {} : { outputTokens: totalOutputTokens }),
      ...(totalCostUsd === undefined ? {} : { costUsd: totalCostUsd }),
    },
    fixtures,
  };
}
