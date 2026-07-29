import {
  buildCaseReport as buildBaseReport,
  renderCaseReportHtml as renderBaseReportHtml,
} from "./case-export.js";
import {
  buildConsistencyAppendix,
  renderConsistencyAppendixHtml,
} from "./report-consistency-model.js";

export function buildCaseReport(input) {
  const report = buildBaseReport(input);
  const consistencyReview = buildConsistencyAppendix(input);
  return {
    ...report,
    settings: {
      ...report.settings,
      includeConsistencyNotes: input.options?.includeConsistencyNotes === true,
    },
    consistencyReview,
    unresolvedConsistencyCount: consistencyReview.unresolvedCount,
    resolvedConsistencyCount: consistencyReview.resolvedCount,
  };
}

export function renderCaseReportHtml(report) {
  const html = renderBaseReportHtml(report);
  const appendix = renderConsistencyAppendixHtml(report.consistencyReview || {
    totalCount: 0,
    unresolvedCount: 0,
    resolvedCount: 0,
    items: [],
  });
  return html.replace("<h2>Source ledger</h2>", `${appendix}<h2>Source ledger</h2>`);
}

export function downloadCaseReport(report, documentRef = document, urlRef = URL) {
  const html = renderCaseReportHtml(report);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = urlRef.createObjectURL(blob);
  const link = documentRef.createElement("a");
  const safe = (report.case.title || "case")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "case";
  link.href = url;
  link.download = `${safe}-verified-record.html`;
  link.click();
  setTimeout(() => urlRef.revokeObjectURL(url), 0);
  return { fileName: link.download, html };
}
