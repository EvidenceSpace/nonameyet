import {
  evaluateExtractionFixture,
  summarizeExtractionEvaluations,
  type ExtractionEvaluationFixture,
  type ExtractionEvaluationResult,
} from "./evaluation.js";

export const EXTRACTION_BENCHMARK_REPORT_VERSION = "extraction-benchmark.v1";

export interface ExtractionBenchmarkRunMetadata {
  provider: string;
  model: string;
  modelVersion: string;
  runAt: string;
  promptVersion: string;
  contractVersion: "file-extraction.v1";
}

export interface ExtractionBenchmarkMetadata extends ExtractionBenchmarkRunMetadata {
  corpusVersion: string;
}

export interface ExtractionBenchmarkCorpus {
  version: string;
  fixtures: ReadonlyArray<ExtractionEvaluationFixture>;
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

function optionalSum(
  outputs: ReadonlyArray<CapturedExtractionOutput>,
  field: "inputTokens" | "outputTokens" | "costUsd",
) {
  if (!outputs.some((output) => output[field] !== undefined)) return undefined;
  return outputs.reduce((total, output) => total + (output[field] ?? 0), 0);
}

/**
 * Builds a comparable report from already-captured model outputs. This function
 * performs no provider calls and rejects partial, duplicated, or padded runs.
 * Corpus identity comes from the supplied registry, never caller metadata.
 */
export function createExtractionBenchmarkReport(args: {
  metadata: ExtractionBenchmarkRunMetadata;
  corpus: ExtractionBenchmarkCorpus;
  outputs: ReadonlyArray<CapturedExtractionOutput>;
}): ExtractionBenchmarkReport {
  requireText(args.metadata.provider, "provider");
  requireText(args.metadata.model, "model");
  requireText(args.metadata.modelVersion, "modelVersion");
  requireText(args.metadata.promptVersion, "promptVersion");
  requireText(args.corpus.version, "corpus.version");
  if (args.metadata.contractVersion !== "file-extraction.v1") {
    throw new BenchmarkValidationError("Unsupported extraction contract version.");
  }
  if (Number.isNaN(Date.parse(args.metadata.runAt))) {
    throw new BenchmarkValidationError("runAt must be an ISO-compatible timestamp.");
  }
  if (args.corpus.fixtures.length === 0) throw new BenchmarkValidationError("At least one fixture is required.");

  const fixtureIds = new Set<string>();
  for (const fixture of args.corpus.fixtures) {
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

  const missing = args.corpus.fixtures
    .filter((fixture) => !outputsByFixture.has(fixture.id))
    .map((fixture) => fixture.id);
  if (missing.length > 0) throw new BenchmarkValidationError(`Missing fixture outputs: ${missing.join(", ")}.`);

  const fixtures = args.corpus.fixtures.map((fixture): ExtractionBenchmarkFixtureResult => {
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
    metadata: { ...args.metadata, corpusVersion: args.corpus.version },
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
