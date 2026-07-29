import { getCase, saveCase } from "./storage.js";
import { checklistEntries, checklistStats, setChecklistState } from "./checklist-model.js";

const caseId = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#workspace-checklist");
const metric = document.querySelector("#check-progress");
const labels = {
  found: "Found",
  missing: "Missing",
  needs_review: "Needs review",
  not_applicable: "Not applicable",
};
const guidance = {
  found: "You marked this record category as collected.",
  missing: "This category is not currently marked as collected.",
  needs_review: "You want to check whether the available records cover this category.",
  not_applicable: "You marked this category as not applicable to this case.",
};

if (caseId && root) {
  let record;
  let saving = false;

  function updateMetric() {
    if (!record || !metric) return;
    const stats = checklistStats(record);
    const expected = `${stats.reviewed}/${stats.total}`;
    if (metric.textContent !== expected) metric.textContent = expected;
    const detail = metric.nextElementSibling;
    if (detail) detail.textContent = stats.notApplicable
      ? `${stats.found} found · ${stats.notApplicable} not applicable`
      : `${stats.found} found · ${stats.needsReview} needs review`;
  }

  function render(message = "") {
    if (!record) return;
    const stats = checklistStats(record);
    root.dataset.enhanced = "true";
    root.innerHTML = `<div class="checklist-state-summary" aria-label="Checklist status summary"><div><strong>${stats.found}</strong><span>Found</span></div><div><strong>${stats.needsReview}</strong><span>Needs review</span></div><div><strong>${stats.missing}</strong><span>Missing</span></div><div><strong>${stats.notApplicable}</strong><span>Not applicable</span></div></div><p class="checklist-save-status" role="status">${message}</p><div class="checklist-state-list">${checklistEntries(record).map((item) => `<div class="checklist-state-row" data-state="${item.status}"><div><strong>${item.title}</strong><small>${item.description}</small><p>${guidance[item.status]}</p></div><label><span>Status</span><select data-key="${item.key}" aria-label="Status for ${item.title}" ${saving ? "disabled" : ""}>${Object.entries(labels).map(([value, label]) => `<option value="${value}" ${value === item.status ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>`).join("")}</div>`;
    root.querySelectorAll("select[data-key]").forEach((select) => select.addEventListener("change", () => changeStatus(select)));
    updateMetric();
  }

  async function changeStatus(select) {
    if (saving) return;
    const previous = record;
    const result = setChecklistState(record, select.dataset.key, select.value);
    if (!result.ok) { render(result.error); return; }
    saving = true;
    record = result.value;
    render("Saving locally…");
    try {
      await saveCase(record);
      saving = false;
      render("Saved on this device.");
      document.dispatchEvent(new CustomEvent("casefind:checklist-updated"));
    } catch {
      record = previous;
      saving = false;
      render("Could not save this change. The previous status is still in place.");
    }
  }

  const rootObserver = new MutationObserver(() => {
    if (root.querySelector(".checklist-row input[type=checkbox]")) render();
  });
  rootObserver.observe(root, { childList: true, subtree: true });

  const metricObserver = metric ? new MutationObserver(updateMetric) : null;
  if (metricObserver) metricObserver.observe(metric, { childList: true, characterData: true, subtree: true });

  getCase(caseId).then((value) => {
    if (!value) return;
    record = value;
    render();
  }).catch(() => {
    root.innerHTML = '<p class="checklist-save-status">Checklist status could not be loaded.</p>';
  });
}
