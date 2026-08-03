import { createId, saveCase } from "./storage.js";
import { validateCaseDetails } from "./case-details-model.js";
import { buildCaseCreationDraft, describeCaseCreationFailure } from "./intake-creation-model.js";
import { noteLocalCaseStored } from "./case-history-model.js";
import { describeIntakeDraftLifecycle, hasMeaningfulIntakeDraft, shouldWarnBeforeIntakeExit } from "./intake-draft-lifecycle.js";
const form = document.querySelector("#intake-form");
const summary = document.querySelector("#summary");
const count = document.querySelector("#summary-count");
const error = document.querySelector("#form-error");
const creationError = document.querySelector("#creation-error");
const back = document.querySelector("#back-button");
const next = document.querySelector("#continue-button");
const spacer = document.querySelector("#action-spacer");
const localStorageAck = document.querySelector("#local-storage-ack");
const draftStatus = document.querySelector("#draft-storage-status");
let step = 1;
let creating = false;
let pendingDraft;
let creationCompleted = false;

function values() {
  return {
    title: document.querySelector("#case-title").value,
    client: document.querySelector("#client").value,
    amount: document.querySelector("#amount").value,
    summary: summary.value,
    goal: document.querySelector('input[name="goal"]:checked')?.value,
  };
}

function currentDraftHasMeaningfulEntries() {
  return hasMeaningfulIntakeDraft({ ...values(), acknowledged: localStorageAck.checked });
}

function updateDraftLifecycle() {
  const lifecycle = describeIntakeDraftLifecycle({
    hasDraft: currentDraftHasMeaningfulEntries(),
    creating,
    saved: creationCompleted,
  });
  draftStatus.dataset.state = lifecycle.state;
  draftStatus.textContent = lifecycle.message;
}

function clearCreationError() {
  creationError.textContent = "";
  delete creationError.dataset.state;
  next.removeAttribute("aria-describedby");
}

function setCreateLabel(retry = false) {
  next.innerHTML = `${retry ? "Try saving again" : "Create private draft"} <span aria-hidden="true">→</span>`;
}

function renderCreationFailure(cause) {
  const failure = describeCaseCreationFailure(cause);
  creationError.dataset.state = failure.state;
  creationError.innerHTML = `<span class="creation-recovery-eyebrow">${failure.eyebrow}</span><strong class="creation-recovery-title">${failure.title}</strong><span class="creation-recovery-detail">${failure.detail}</span><span class="creation-recovery-instruction">${failure.instruction}</span>`;
  next.setAttribute("aria-describedby", "creation-error");
  setCreateLabel(true);
  creationError.focus();
}

function render() {
  document.querySelectorAll(".form-step").forEach((section) => section.classList.toggle("active", Number(section.dataset.step) === step));
  document.querySelector("#step-label").textContent = `Step ${step} of 3`;
  document.querySelector("#step-progress").style.width = `${step * 33.333}%`;
  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    const itemStep = Number(item.dataset.stepIndicator);
    item.classList.toggle("active", itemStep <= step);
    item.querySelector(":scope > span").textContent = itemStep < step ? "✓" : String(itemStep);
  });
  back.classList.toggle("hidden", step === 1);
  spacer.classList.toggle("hidden", step > 1);
  next.innerHTML = step === 3 ? 'Create private draft <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
  error.textContent = "";
  clearCreationError();
}

function validFirstStep() {
  const result = validateCaseDetails(values());
  if (!result.ok) {
    error.textContent = result.error;
    return false;
  }
  return true;
}

function updateSummaryCount() {
  const length = summary.value.trim().length;
  count.textContent = `${length}/30 minimum · 4,000 maximum`;
  count.className = length >= 30 && length <= 4000 ? "valid" : "hint";
}
summary.addEventListener("input", updateSummaryCount);
form.addEventListener("input", updateDraftLifecycle);
form.addEventListener("change", updateDraftLifecycle);
window.addEventListener("beforeunload", (event) => {
  if (!shouldWarnBeforeIntakeExit({ hasDraft: currentDraftHasMeaningfulEntries(), saved: creationCompleted })) return;
  event.preventDefault();
  event.returnValue = "";
});

document.querySelectorAll('input[name="goal"]').forEach((input) => input.addEventListener("change", () => {
  document.querySelectorAll(".goal-card").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked));
}));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (creating) return;
  if (step === 1 && !validFirstStep()) return;
  if (step < 3) { step += 1; render(); return; }
  if (!localStorageAck.checked) {
    creationError.textContent = "Confirm that you understand this draft is stored only in this browser profile before creating it.";
    localStorageAck.focus();
    return;
  }
  const result = validateCaseDetails(values());
  if (!result.ok) {
    step = 1;
    render();
    error.textContent = result.error;
    document.querySelector("#case-title").focus();
    return;
  }
  creating = true;
  updateDraftLifecycle();
  form.setAttribute("aria-busy", "true");
  next.disabled = true;
  next.textContent = "Saving on this device…";
  clearCreationError();
  pendingDraft = buildCaseCreationDraft(result.value, pendingDraft, {
    createId,
    now: () => new Date().toISOString(),
  });
  try {
    await saveCase(pendingDraft);
    noteLocalCaseStored();
    creationCompleted = true;
    updateDraftLifecycle();
    draftStatus.hidden = true;
    form.classList.add("hidden");
    document.querySelector(".intake-aside").classList.add("hidden");
    const created = document.querySelector("#created-state");
    document.querySelector("#created-title").textContent = pendingDraft.title;
    document.querySelector("#open-workspace").href = `case.html?id=${encodeURIComponent(pendingDraft.id)}`;
    created.classList.remove("hidden");
    created.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (cause) {
    renderCreationFailure(cause);
  } finally {
    creating = false;
    form.removeAttribute("aria-busy");
    next.disabled = false;
    if (!form.classList.contains("hidden")) {
      updateDraftLifecycle();
      if (!creationError.textContent) setCreateLabel();
    }
  }
});
back.addEventListener("click", () => { if (!creating) { step = Math.max(1, step - 1); render(); } });
document.querySelector("#restart-button").addEventListener("click", () => { form.reset(); step = 1; creating = false; creationCompleted = false; pendingDraft = undefined; draftStatus.hidden = false; form.removeAttribute("aria-busy"); next.disabled = false; form.classList.remove("hidden"); document.querySelector(".intake-aside").classList.remove("hidden"); document.querySelector("#created-state").classList.add("hidden"); clearCreationError(); updateSummaryCount(); updateDraftLifecycle(); render(); });
updateSummaryCount();
updateDraftLifecycle();
render();
