import {
  buildCaseReport as buildBaseReport,
  renderCaseReportHtml as renderBaseReportHtml,
} from "./case-export.js";
import {
  buildConsistencyAppendix,
  renderConsistencyAppendixHtml,
} from "./report-consistency-model.js";
import {
  buildChecklistAppendix,
  renderChecklistAppendixHtml,
} from "./report-checklist-model.js";

const PRINT_LAYOUT_STYLES = `<style id="casefind-print-layout">
@page{size:A4;margin:16mm 14mm 18mm}
.print-guidance{max-width:860px;margin:20px auto -26px;padding:10px 14px;border:1px solid #cfe2f2;border-radius:8px;background:#f4f9fd;color:#315c78;font-size:12px}
.print-guidance b{display:block;margin-bottom:2px}
@media print{
  html{background:#fff}
  body{margin:0;max-width:none;padding:0;font-size:10.5pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .print-guidance{display:none!important}
  .report-cover{padding-top:8mm}
  .report-scope{break-after:page;page-break-after:always}
  h2{break-after:avoid;page-break-after:avoid}
  .fact,.source,blockquote,tr{break-inside:avoid;page-break-inside:avoid}
  thead{display:table-header-group}
  tfoot{display:table-footer-group}
  table{font-size:9pt}
  code{font-size:8pt}
  .boundary{break-inside:avoid;page-break-inside:avoid}
}
</style>`;

function enhancePrintableReport(html) {
  const withStyles = html.replace("</head>", `${PRINT_LAYOUT_STYLES}</head>`);
  const withGuidance = withStyles.replace(
    "<body><header>",
    `<body><aside class="print-guidance" role="note"><b>Ready to save as PDF</b>Open your browser’s Print dialog, choose “Save as PDF,” keep the A4 paper size, and review every page before sharing.</aside><header class="report-cover">`,
  );
  const withCoverBreak = withGuidance.replace(
    '<section class="notice">',
    '<section class="notice report-scope">',
  );
  return withCoverBreak.replace(" · Amount remaining: ₹", " · Amount entered: ");
}

export function buildCaseReport(input) {
  const report = buildBaseReport(input);
  const consistencyReview = buildConsistencyAppendix(input);
  const checklistReview = buildChecklistAppendix(input.record, report.settings.includeChecklist);
  return {
    ...report,
    settings: {
      ...report.settings,
      includeConsistencyNotes: input.options?.includeConsistencyNotes === true,
    },
    checklistReview,
    consistencyReview,
    unresolvedConsistencyCount: consistencyReview.unresolvedCount,
    resolvedConsistencyCount: consistencyReview.resolvedCount,
  };
}

export function renderCaseReportHtml(report) {
  const html = renderBaseReportHtml({
    ...report,
    settings: { ...report.settings, includeChecklist: false },
  });
  const checklist = renderChecklistAppendixHtml(report.checklistReview);
  const consistency = renderConsistencyAppendixHtml(report.consistencyReview || {
    totalCount: 0,
    unresolvedCount: 0,
    resolvedCount: 0,
    items: [],
  });
  const completeHtml = html.replace("<h2>Source ledger</h2>", `${checklist}${consistency}<h2>Source ledger</h2>`);
  return enhancePrintableReport(completeHtml);
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
