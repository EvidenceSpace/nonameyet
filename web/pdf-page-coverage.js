export const MAX_PDF_WARNING_PAGE_REFERENCES = 20;

export function buildPdfPageCoverageWarnings(pageNumbers) {
  if (!pageNumbers.length) return [];
  if (pageNumbers.length === 1) {
    return [`Page ${pageNumbers[0]} has no selectable text and was not included in AI-ready text. Review it in the original PDF.`];
  }
  const sample = pageNumbers.slice(0, MAX_PDF_WARNING_PAGE_REFERENCES).join(", ");
  const remaining = pageNumbers.length - MAX_PDF_WARNING_PAGE_REFERENCES;
  const suffix = remaining > 0 ? `, and ${remaining} more` : "";
  return [`${pageNumbers.length} pages have no selectable text and were not included in AI-ready text (pages ${sample}${suffix}). Review them in the original PDF.`];
}
