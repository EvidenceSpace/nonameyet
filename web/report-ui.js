import { getCase, getFilesForCase, getFactsForCase, getSuggestionsForCase, getEventsForCase } from "./storage.js";
import { buildCaseReport, downloadCaseReport, renderCaseReportHtml } from "./case-report-consistency.js";

const caseId = new URLSearchParams(location.search).get("id");
const button = document.querySelector(".workspace-topline > .button-secondary:not(.backup-trigger)");
let data;

const dialog = document.createElement("dialog");
dialog.className = "report-preflight";
dialog.innerHTML = `<div class="report-head"><div><span class="section-label">EXPORT REVIEW</span><h2>Review before downloading</h2></div><button class="dialog-close" type="button" aria-label="Close">×</button></div><div class="report-counts"><div><span>Verified facts</span><strong id="report-facts">0</strong></div><div><span>Timeline events</span><strong id="report-events">0</strong></div><div><span>Sources</span><strong id="report-sources">0</strong></div><div><span>Awaiting review</span><strong id="report-pending">0</strong></div><div><span>Source differences</span><strong id="report-conflicts">0</strong></div></div><div class="report-warning" id="report-warning"></div><fieldset><legend>Choose what to include</legend><label><input id="report-summary" type="checkbox" checked><span><b>Case summary</b><small>The situation description entered when creating the case.</small></span></label><label><input id="report-notes" type="checkbox"><span><b>Private fact notes</b><small>Off by default. Notes may contain sensitive context.</small></span></label><label><input id="report-consistency-notes" type="checkbox"><span><b>Source-comparison notes</b><small>Off by default. User-entered comparison notes may contain sensitive context.</small></span></label><label><input id="report-quotes" type="checkbox" checked><span><b>Source excerpts</b><small>Exact excerpts attached to confirmed facts, comparisons, and timeline events.</small></span></label><label><input id="report-timeline" type="checkbox" checked><span><b>Source-linked timeline</b><small>User-entered events whose source hashes still match.</small></span></label><label><input id="report-checklist" type="checkbox" checked><span><b>Collection checklist status</b><small>All six user-controlled statuses, including missing, needs review, and not applicable.</small></span></label></fieldset><div class="report-fixed"><span>Always included</span><p>Verified values, deterministic source comparisons and decisions, source filenames, source locators, SHA-256 hashes, verification labels, and product boundaries.</p></div><div class="report-actions"><button class="button-secondary" id="preview-report" type="button">Preview in new tab</button><button class="button" id="download-report" type="button">Download report</button></div>`;
document.body.append(dialog);

function options() {
  return {
    includeSummary: dialog.querySelector("#report-summary").checked,
    includeNotes: dialog.querySelector("#report-notes").checked,
    includeConsistencyNotes: dialog.querySelector("#report-consistency-notes").checked,
    includeSourceQuotes: dialog.querySelector("#report-quotes").checked,
    includeChecklist: dialog.querySelector("#report-checklist").checked,
    includeTimeline: dialog.querySelector("#report-timeline").checked,
  };
}

function report() { return buildCaseReport({ ...data, options: options() }); }

async function load() {
  const [record, files, facts, suggestions, events] = await Promise.all([
    getCase(caseId), getFilesForCase(caseId), getFactsForCase(caseId),
    getSuggestionsForCase(caseId), getEventsForCase(caseId),
  ]);
  if (!record) throw new Error("Case not found");
  data = { record, files, facts, suggestions, events };
  const prepared = buildCaseReport(data);
  dialog.querySelector("#report-facts").textContent = prepared.facts.length;
  dialog.querySelector("#report-events").textContent = prepared.timeline.length;
  dialog.querySelector("#report-sources").textContent = prepared.sources.length;
  dialog.querySelector("#report-pending").textContent = prepared.pendingReviewCount;
  dialog.querySelector("#report-conflicts").textContent = prepared.unresolvedConsistencyCount;
  dialog.querySelector("#report-warning").textContent = `${prepared.pendingReviewCount} unresolved suggestion${prepared.pendingReviewCount === 1 ? "" : "s"}, ${prepared.excludedFactCount} incomplete fact${prepared.excludedFactCount === 1 ? "" : "s"}, and ${prepared.excludedTimelineCount} timeline event${prepared.excludedTimelineCount === 1 ? "" : "s"} will stay out of the report. ${prepared.unresolvedConsistencyCount} source comparison${prepared.unresolvedConsistencyCount === 1 ? " remains" : "s remain"} unresolved and will be disclosed.`;
}

if (caseId && button) {
  button.disabled = false;
  button.textContent = "Download report";
  button.onclick = async () => {
    button.disabled = true;
    button.textContent = "Preparing…";
    try { await load(); dialog.showModal(); }
    finally { button.disabled = false; button.textContent = "Download report"; }
  };
}

dialog.querySelector(".dialog-close").onclick = () => dialog.close();
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialog.querySelector("#download-report").onclick = () => { downloadCaseReport(report()); dialog.close(); };
dialog.querySelector("#preview-report").onclick = () => {
  const blob = new Blob([renderCaseReportHtml(report())], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
