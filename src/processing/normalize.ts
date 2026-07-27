import { PROCESSING_PIPELINE_VERSION, type ExtractedPage, type ExtractionArtifact, type NormalizedPage } from "./types.js";

export const DEFAULT_MAX_EXTRACTED_CHARACTERS = 500_000;

export class ExtractionOutputError extends Error {
  constructor(
    message: string,
    readonly code: "empty_text" | "output_too_large" | "corrupt_file",
  ) {
    super(message);
    this.name = "ExtractionOutputError";
  }
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
    warnings: [...(args.warnings ?? [])],
  };
}
