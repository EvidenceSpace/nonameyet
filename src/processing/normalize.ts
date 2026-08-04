import { PROCESSING_PIPELINE_VERSION, type ExtractedPage, type ExtractionArtifact, type NormalizedPage } from "./types.js";

export const DEFAULT_MAX_EXTRACTED_CHARACTERS = 500_000;
export const DEFAULT_MAX_EXTRACTION_WARNINGS = 100;
export const DEFAULT_MAX_EXTRACTION_WARNING_CHARACTERS = 1_000;
export const DEFAULT_MAX_EXTRACTION_WARNING_TOTAL_CHARACTERS = 20_000;

export class ExtractionOutputError extends Error {
  constructor(
    message: string,
    readonly code: "empty_text" | "output_too_large" | "corrupt_file",
  ) {
    super(message);
    this.name = "ExtractionOutputError";
  }
}

function validateWarnings(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ExtractionOutputError("Extraction warnings are malformed.", "corrupt_file");
  if (value.length > DEFAULT_MAX_EXTRACTION_WARNINGS) throw new ExtractionOutputError("Extraction returned too many warnings.", "output_too_large");

  let totalCharacters = 0;
  for (const warning of value) {
    if (typeof warning !== "string" || !warning.trim()) throw new ExtractionOutputError("Extraction warnings are malformed.", "corrupt_file");
    if (warning.length > DEFAULT_MAX_EXTRACTION_WARNING_CHARACTERS) throw new ExtractionOutputError("An extraction warning exceeds the safe limit.", "output_too_large");
    totalCharacters += warning.length;
    if (totalCharacters > DEFAULT_MAX_EXTRACTION_WARNING_TOTAL_CHARACTERS) throw new ExtractionOutputError("Extraction warnings exceed the total safe limit.", "output_too_large");
  }
  return [...value];
}

/** Removes control characters while preserving tabs and line breaks. */
export function normalizeExtractedText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

export function buildExtractionArtifact(args: {
  fileId: string;
  fileHash: string;
  adapterId: string;
  adapterVersion: string;
  pages: ExtractedPage[];
  warnings?: string[];
  extractedAt: string;
  maxCharacters?: number;
}): ExtractionArtifact {
  const maxCharacters = args.maxCharacters ?? DEFAULT_MAX_EXTRACTED_CHARACTERS;
  const warnings = validateWarnings(args.warnings);
  if (args.pages.length === 0) throw new ExtractionOutputError("The adapter returned no pages.", "empty_text");

  const pageNumbers = new Set<number>();
  const normalized: Array<{ pageNumber: number; text: string }> = [];
  for (const page of args.pages) {
    if (!Number.isInteger(page.pageNumber) || page.pageNumber < 1 || pageNumbers.has(page.pageNumber)) {
      throw new ExtractionOutputError("Page numbers must be unique positive integers.", "corrupt_file");
    }
    pageNumbers.add(page.pageNumber);
    normalized.push({ pageNumber: page.pageNumber, text: normalizeExtractedText(page.text) });
  }
  normalized.sort((left, right) => left.pageNumber - right.pageNumber);

  const pages: NormalizedPage[] = [];
  let text = "";
  for (const page of normalized) {
    if (!page.text) continue;
    if (text) text += "\n\n";
    const start = text.length;
    text += page.text;
    pages.push({ pageNumber: page.pageNumber, text: page.text, start, end: text.length });
    if (text.length > maxCharacters) {
      throw new ExtractionOutputError(`Extracted text exceeds ${maxCharacters} characters.`, "output_too_large");
    }
  }

  if (!text) throw new ExtractionOutputError("The adapter returned no readable text.", "empty_text");

  return {
    fileId: args.fileId,
    fileHash: args.fileHash,
    pipelineVersion: PROCESSING_PIPELINE_VERSION,
    adapterId: args.adapterId,
    adapterVersion: args.adapterVersion,
    extractedAt: args.extractedAt,
    text,
    pages,
    warnings,
  };
}
