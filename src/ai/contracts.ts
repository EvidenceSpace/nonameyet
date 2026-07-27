import type { SourceLocator } from "../domain/case.js";

export const EXTRACTION_CONTRACT_VERSION = "file-extraction.v1";

export interface ExtractedCandidate {
  kind: "fact" | "event";
  label: string;
  value: string;
  occurredAt?: string;
  confidence: number;
  locator: SourceLocator;
  uncertainty?: string;
}

export interface FileExtractionResult {
  contractVersion: typeof EXTRACTION_CONTRACT_VERSION;
  documentType:
    | "agreement"
    | "client_message"
    | "invoice"
    | "payment_record"
    | "delivery_record"
    | "other";
  participants: string[];
  candidates: ExtractedCandidate[];
  warnings: string[];
}

export function validateExtractionResult(value: unknown): value is FileExtractionResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<FileExtractionResult>;
  if (result.contractVersion !== EXTRACTION_CONTRACT_VERSION) return false;
  if (!Array.isArray(result.participants) || !result.participants.every((item) => typeof item === "string")) return false;
  if (!Array.isArray(result.warnings) || !result.warnings.every((item) => typeof item === "string")) return false;
  if (!Array.isArray(result.candidates)) return false;

  return result.candidates.every((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const item = candidate as Partial<ExtractedCandidate>;
    return (
      (item.kind === "fact" || item.kind === "event") &&
      typeof item.label === "string" &&
      typeof item.value === "string" &&
      typeof item.confidence === "number" &&
      item.confidence >= 0 &&
      item.confidence <= 1 &&
      !!item.locator &&
      typeof item.locator === "object"
    );
  });
}
