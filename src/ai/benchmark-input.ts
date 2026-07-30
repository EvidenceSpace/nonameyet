import {
  BenchmarkValidationError,
  type CapturedExtractionOutput,
  type ExtractionBenchmarkRunMetadata,
} from "./benchmark.js";

export interface ExtractionBenchmarkInput {
  metadata: ExtractionBenchmarkRunMetadata;
  outputs: CapturedExtractionOutput[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== "string") throw new BenchmarkValidationError(`${field} must be a string.`);
  return value;
}

function optionalNumber(record: Record<string, unknown>, field: string): number | undefined {
  const value = record[field];
  if (value === undefined) return undefined;
  if (typeof value !== "number") throw new BenchmarkValidationError(`${field} must be a number when provided.`);
  return value;
}

/** Parses untrusted JSON before it reaches the deterministic report builder. */
export function parseExtractionBenchmarkInput(value: unknown): ExtractionBenchmarkInput {
  if (!isRecord(value)) throw new BenchmarkValidationError("Benchmark input must be an object.");
  if (!isRecord(value.metadata)) throw new BenchmarkValidationError("metadata must be an object.");
  if (!Array.isArray(value.outputs)) throw new BenchmarkValidationError("outputs must be an array.");
  if (value.outputs.length > 1_000) throw new BenchmarkValidationError("outputs exceeds the 1,000-record safety limit.");

  const contractVersion = requireString(value.metadata, "contractVersion");
  if (contractVersion !== "file-extraction.v1") {
    throw new BenchmarkValidationError("Unsupported extraction contract version.");
  }
  const metadata: ExtractionBenchmarkRunMetadata = {
    provider: requireString(value.metadata, "provider"),
    model: requireString(value.metadata, "model"),
    modelVersion: requireString(value.metadata, "modelVersion"),
    runAt: requireString(value.metadata, "runAt"),
    promptVersion: requireString(value.metadata, "promptVersion"),
    contractVersion,
  };

  const outputs = value.outputs.map((raw, index): CapturedExtractionOutput => {
    if (!isRecord(raw)) throw new BenchmarkValidationError(`outputs[${index}] must be an object.`);
    if (!Object.hasOwn(raw, "response")) throw new BenchmarkValidationError(`outputs[${index}].response is required.`);
    const latencyMs = raw.latencyMs;
    if (typeof latencyMs !== "number") throw new BenchmarkValidationError(`outputs[${index}].latencyMs must be a number.`);
    const inputTokens = optionalNumber(raw, "inputTokens");
    const outputTokens = optionalNumber(raw, "outputTokens");
    const costUsd = optionalNumber(raw, "costUsd");
    return {
      fixtureId: requireString(raw, "fixtureId"),
      response: raw.response,
      latencyMs,
      ...(inputTokens === undefined ? {} : { inputTokens }),
      ...(outputTokens === undefined ? {} : { outputTokens }),
      ...(costUsd === undefined ? {} : { costUsd }),
    };
  });

  return { metadata, outputs };
}
