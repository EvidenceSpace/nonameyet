import type { SourceLocator } from "../domain/case.js";

export const MIN_QUOTE_LENGTH = 4;

/**
 * Normalizes text so a quote can be compared against document text without
 * being defeated by whitespace, casing, or typographic punctuation.
 */
export function normalizeForGrounding(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getLocatorQuote(locator: SourceLocator): string | undefined {
  return typeof locator.quote === "string" ? locator.quote : undefined;
}

/**
 * A quote is grounded only when it appears verbatim in the document text that
 * was sent to the model. Anything else is treated as unsupported.
 */
export function isQuoteGrounded(quote: string, sourceText: string): boolean {
  const normalizedQuote = normalizeForGrounding(quote);
  if (normalizedQuote.length < MIN_QUOTE_LENGTH) return false;
  return normalizeForGrounding(sourceText).includes(normalizedQuote);
}
