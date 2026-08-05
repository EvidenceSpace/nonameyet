export const MAX_PDF_WARNING_PAGE_REFERENCES = 20;

function pageSummary(pageNumbers) {
  const sample = pageNumbers.slice(0, MAX_PDF_WARNING_PAGE_REFERENCES).join(", ");
  const remaining = pageNumbers.length - MAX_PDF_WARNING_PAGE_REFERENCES;
  return `${sample}${remaining > 0 ? `, and ${remaining} more` : ""}`;
}

export function buildPdfPageCoverageWarnings(pageNumbers) {
  if (!pageNumbers.length) return [];
  if (pageNumbers.length === 1) {
    return [`Page ${pageNumbers[0]} has no selectable text and was not included in AI-ready text. Review it in the original PDF.`];
  }
  return [`${pageNumbers.length} pages have no selectable text and were not included in AI-ready text (pages ${pageSummary(pageNumbers)}). Review them in the original PDF.`];
}

export function buildPdfOcrCoverageWarnings(pageNumbers) {
  if (!pageNumbers.length) return [];
  if (pageNumbers.length === 1) {
    return [`Page ${pageNumbers[0]} has no readable text after local OCR and was not included in AI-ready text. Review it in the original PDF.`];
  }
  return [`${pageNumbers.length} pages have no readable text after local OCR and were not included in AI-ready text (pages ${pageSummary(pageNumbers)}). Review them in the original PDF.`];
}

export function buildPdfOcrFailureWarnings(pageNumbers) {
  if (!pageNumbers.length) return [];
  const subject = pageNumbers.length === 1
    ? `page ${pageNumbers[0]}`
    : `${pageNumbers.length} pages (${pageSummary(pageNumbers)})`;
  return [`Local OCR did not complete for ${subject}; text from those pages was not included in AI-ready text. Review the original PDF.`];
}
