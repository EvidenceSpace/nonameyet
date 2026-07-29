import { checklistEntries, checklistStats } from "./checklist-model.js";

const STATUS_LABELS = {
  found: "Found",
  missing: "Missing",
  needs_review: "Needs review",
  not_applicable: "Not applicable",
};

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function buildChecklistAppendix(record = {}, include = true) {
  if (!include) return null;
  const stats = checklistStats(record);
  return {
    version: "casefind-checklist-status.v1",
    ...stats,
    items: checklistEntries(record).map(({ key, title, status }) => ({ key, title, status })),
  };
}

export function renderChecklistAppendixHtml(review) {
  if (!review) return "";
  const rows = review.items.map((item) => `<tr><td>${escape(item.title)}</td><td><span class="checklist-status checklist-${escape(item.status)}">${escape(STATUS_LABELS[item.status] || "Missing")}</span></td></tr>`).join("");
  return `<section class="checklist-report"><h2>Collection checklist status</h2><p class="meta">User-controlled organization labels for the six standard record categories. These statuses do not establish that a record is authentic, sufficient, or legally required.</p><div class="checklist-report-counts"><span>${review.found} found</span><span>${review.needsReview} needs review</span><span>${review.missing} missing</span><span>${review.notApplicable} not applicable</span></div><table><thead><tr><th>Record category</th><th>User status</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}
