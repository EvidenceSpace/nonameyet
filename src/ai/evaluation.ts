import type { ExtractedCandidate, FileExtractionResult } from "./contracts.js";
import { normalizeForGrounding } from "./grounding.js";
import { ingestFileExtraction, type RejectionReason } from "./review.js";

export interface ExtractionEvaluationFixture {
  id: string;
  fileName: string;
  text: string;
  documentType: FileExtractionResult["documentType"];
  expected: ExtractedCandidate[];
  forbiddenValues?: string[];
  expectedInjectionRules?: string[];
}

export interface ExtractionEvaluationResult {
  fixtureId: string;
  passed: boolean;
  contractAccepted: boolean;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  falsePositiveKeys: string[];
  falseNegativeKeys: string[];
  forbiddenValuesFound: string[];
  injectionRules: string[];
  missingInjectionRules: string[];
  rejectedReasons: RejectionReason[];
  acceptedStatuses: string[];
}

function candidateKey(candidate: Pick<ExtractedCandidate, "kind" | "label" | "value">): string {
  return [candidate.kind, normalizeForGrounding(candidate.label), normalizeForGrounding(candidate.value)].join("|");
}

export function buildReferenceExtraction(fixture: ExtractionEvaluationFixture): FileExtractionResult {
  return {
    contractVersion: "file-extraction.v1",
    documentType: fixture.documentType,
    participants: [],
    candidates: fixture.expected.map((candidate) => ({ ...candidate, locator: { ...candidate.locator } })),
    warnings: [],
  };
}

export function evaluateExtractionFixture(
  fixture: ExtractionEvaluationFixture,
  providerResult: unknown,
): ExtractionEvaluationResult {
  let sequence = 0;
  const ingestion = ingestFileExtraction({
    caseId: `evaluation_${fixture.id}`,
    fileId: `file_${fixture.id}`,
    sourceText: fixture.text,
    result: providerResult,
    createId: (prefix) => `${prefix}_${++sequence}`,
  });

  const expectedKeys = new Set(fixture.expected.map(candidateKey));
  const actualKeys = new Set(ingestion.suggestions.map(candidateKey));
  const truePositiveKeys = [...actualKeys].filter((key) => expectedKeys.has(key));
  const falsePositiveKeys = [...actualKeys].filter((key) => !expectedKeys.has(key));
  const falseNegativeKeys = [...expectedKeys].filter((key) => !actualKeys.has(key));
  const forbidden = new Set((fixture.forbiddenValues ?? []).map(normalizeForGrounding));
  const forbiddenValuesFound = ingestion.suggestions
    .map((suggestion) => suggestion.value)
    .filter((value) => forbidden.has(normalizeForGrounding(value)));
  const injectionRules = [...new Set(ingestion.injectionSignals.map((signal) => signal.rule))].sort();
  const missingInjectionRules = (fixture.expectedInjectionRules ?? [])
    .filter((rule) => !injectionRules.includes(rule))
    .sort();
  const truePositives = truePositiveKeys.length;
  const falsePositives = falsePositiveKeys.length;
  const falseNegatives = falseNegativeKeys.length;

  return {
    fixtureId: fixture.id,
    passed:
      ingestion.contractAccepted &&
      falsePositives === 0 &&
      falseNegatives === 0 &&
      forbiddenValuesFound.length === 0 &&
      missingInjectionRules.length === 0,
    contractAccepted: ingestion.contractAccepted,
    truePositives,
    falsePositives,
    falseNegatives,
    precision: truePositives + falsePositives === 0 ? (expectedKeys.size === 0 ? 1 : 0) : truePositives / (truePositives + falsePositives),
    recall: expectedKeys.size === 0 ? 1 : truePositives / expectedKeys.size,
    falsePositiveKeys,
    falseNegativeKeys,
    forbiddenValuesFound,
    injectionRules,
    missingInjectionRules,
    rejectedReasons: ingestion.rejected.map((candidate) => candidate.reason),
    acceptedStatuses: ingestion.suggestions.map((suggestion) => suggestion.status),
  };
}

export function summarizeExtractionEvaluations(results: ExtractionEvaluationResult[]) {
  const totals = results.reduce(
    (summary, result) => ({
      truePositives: summary.truePositives + result.truePositives,
      falsePositives: summary.falsePositives + result.falsePositives,
      falseNegatives: summary.falseNegatives + result.falseNegatives,
      passedFixtures: summary.passedFixtures + Number(result.passed),
    }),
    { truePositives: 0, falsePositives: 0, falseNegatives: 0, passedFixtures: 0 },
  );
  return {
    ...totals,
    totalFixtures: results.length,
    precision:
      totals.truePositives + totals.falsePositives === 0
        ? 1
        : totals.truePositives / (totals.truePositives + totals.falsePositives),
    recall:
      totals.truePositives + totals.falseNegatives === 0
        ? 1
        : totals.truePositives / (totals.truePositives + totals.falseNegatives),
  };
}
