import type { SourceReference, VerificationStatus } from "../domain/case.js";
import { EXTRACTION_CONTRACT_VERSION, validateExtractionResult } from "./contracts.js";
import { detectInjectionSignals, type InjectionSignal } from "./injection.js";
import { getLocatorQuote, isQuoteGrounded, normalizeForGrounding } from "./grounding.js";

export const MAX_SUGGESTIONS_PER_FILE = 100;
export const MIN_SUGGESTION_CONFIDENCE = 0.15;

export type RejectionReason =
  | "invalid_contract"
  | "missing_quote"
  | "ungrounded_quote"
  | "low_confidence"
  | "empty_value"
  | "duplicate"
  | "limit_reached";

export interface SuggestionRecord {
  id: string;
  caseId: string;
  fileId: string;
  kind: "fact" | "event";
  label: string;
  value: string;
  occurredAt?: string;
  confidence: number;
  status: "suggested";
  sourceReference: SourceReference;
  uncertainty?: string;
}

export interface RejectedCandidate {
  label: string;
  reason: RejectionReason;
}

export interface IngestResult {
  contractAccepted: boolean;
  suggestions: SuggestionRecord[];
  rejected: RejectedCandidate[];
  injectionSignals: InjectionSignal[];
  modelWarnings: string[];
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/**
 * Converts a model response into review items. Nothing produced here is ever
 * confirmed: every item requires an explicit user decision.
 */
export function ingestFileExtraction(args: {
  caseId: string;
  fileId: string;
  sourceText: string;
  result: unknown;
  createId: (prefix: string) => string;
}): IngestResult {
  const injectionSignals = detectInjectionSignals(args.sourceText);

  if (!validateExtractionResult(args.result)) {
    return {
      contractAccepted: false,
      suggestions: [],
      rejected: [{ label: "", reason: "invalid_contract" }],
      injectionSignals,
      modelWarnings: [],
    };
  }

  const suggestions: SuggestionRecord[] = [];
  const rejected: RejectedCandidate[] = [];
  const seen = new Set<string>();

  for (const candidate of args.result.candidates) {
    if (suggestions.length >= MAX_SUGGESTIONS_PER_FILE) {
      rejected.push({ label: candidate.label, reason: "limit_reached" });
      continue;
    }
    if (candidate.value.trim().length === 0 || candidate.label.trim().length === 0) {
      rejected.push({ label: candidate.label, reason: "empty_value" });
      continue;
    }
    if (candidate.confidence < MIN_SUGGESTION_CONFIDENCE) {
      rejected.push({ label: candidate.label, reason: "low_confidence" });
      continue;
    }

    const quote = getLocatorQuote(candidate.locator);
    if (!quote) {
      rejected.push({ label: candidate.label, reason: "missing_quote" });
      continue;
    }
    if (!isQuoteGrounded(quote, args.sourceText)) {
      rejected.push({ label: candidate.label, reason: "ungrounded_quote" });
      continue;
    }

    const key = `${candidate.kind}|${normalizeForGrounding(candidate.label)}|${normalizeForGrounding(candidate.value)}`;
    if (seen.has(key)) {
      rejected.push({ label: candidate.label, reason: "duplicate" });
      continue;
    }
    seen.add(key);

    const sourceReference: SourceReference = {
      id: args.createId("source"),
      fileId: args.fileId,
      locator: candidate.locator,
      extractionVersion: EXTRACTION_CONTRACT_VERSION,
    };

    suggestions.push({
      id: args.createId("suggestion"),
      caseId: args.caseId,
      fileId: args.fileId,
      kind: candidate.kind,
      label: candidate.label.trim(),
      value: candidate.value.trim(),
      confidence: candidate.confidence,
      status: "suggested",
      sourceReference,
      ...(isIsoTimestamp(candidate.occurredAt) ? { occurredAt: candidate.occurredAt } : {}),
      ...(typeof candidate.uncertainty === "string" && candidate.uncertainty.trim().length > 0
        ? { uncertainty: candidate.uncertainty.trim() }
        : {}),
    });
  }

  return {
    contractAccepted: true,
    suggestions,
    rejected,
    injectionSignals,
    modelWarnings: args.result.warnings,
  };
}

export type UserDecision =
  | { type: "confirm" }
  | { type: "correct"; value: string }
  | { type: "dismiss" }
  | { type: "uncertain" };

export interface ResolvedSuggestion {
  suggestionId: string;
  status: VerificationStatus;
  value: string;
  sourceReferences: SourceReference[];
  decidedByUser: true;
  aiSuggested: true;
}

/**
 * The only path from a suggestion to a stored fact. A suggestion cannot be
 * confirmed or corrected unless it still carries its source reference.
 */
export function resolveSuggestion(suggestion: SuggestionRecord, decision: UserDecision): ResolvedSuggestion {
  const needsProvenance = decision.type === "confirm" || decision.type === "correct";
  if (needsProvenance && !suggestion.sourceReference) {
    throw new Error("A suggestion without a source reference cannot be confirmed.");
  }
  if (decision.type === "correct" && decision.value.trim().length === 0) {
    throw new Error("A correction requires a value.");
  }

  const status: VerificationStatus =
    decision.type === "confirm"
      ? "confirmed"
      : decision.type === "correct"
        ? "corrected"
        : decision.type === "dismiss"
          ? "dismissed"
          : "uncertain";

  return {
    suggestionId: suggestion.id,
    status,
    value: decision.type === "correct" ? decision.value.trim() : suggestion.value,
    sourceReferences: [suggestion.sourceReference],
    decidedByUser: true,
    aiSuggested: true,
  };
}

export interface SuggestionConflict {
  label: string;
  suggestionIds: string[];
  values: string[];
}

/**
 * Flags the same label carrying different values so the user can decide which
 * record is correct. Conflicts are surfaced, never silently resolved.
 */
export function findSuggestionConflicts(
  items: ReadonlyArray<{ id: string; label: string; value: string; status: VerificationStatus }>,
): SuggestionConflict[] {
  const groups = new Map<string, { label: string; entries: Array<{ id: string; value: string }> }>();

  for (const item of items) {
    if (item.status === "dismissed") continue;
    const key = normalizeForGrounding(item.label);
    const group = groups.get(key) ?? { label: item.label, entries: [] };
    group.entries.push({ id: item.id, value: item.value });
    groups.set(key, group);
  }

  const conflicts: SuggestionConflict[] = [];
  for (const group of groups.values()) {
    const distinct = new Set(group.entries.map((entry) => normalizeForGrounding(entry.value)));
    if (distinct.size > 1) {
      conflicts.push({
        label: group.label,
        suggestionIds: group.entries.map((entry) => entry.id),
        values: group.entries.map((entry) => entry.value),
      });
    }
  }
  return conflicts;
}
