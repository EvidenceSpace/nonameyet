import { createId, saveCase } from "./storage.js";
import { validateCaseDetails } from "./case-details-model.js";
const form = document.querySelector("#intake-form");
const summary = document.querySelector("#summary");
const count = document.querySelector("#summary-count");
const error = document.querySelector("#form-error");
const creationError = document.querySelector("#creation-error");
const back = document.querySelector("#back-button");
const next = document.querySelector("#continue-button");
const spacer = document.querySelector("#action-spacer");
let step = 1;
let creating = false;

function values() {
  return {
    title: document.querySelector("#case-title").value,
    client: document.querySelector("#client").value,
    amount: document.querySelector("#amount").value,
    summary: summary.value,
    goal: document.querySelector('input[name="goal"]:checked')?.value,
  };
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
  creationError.textContent = "";
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

document.querySelectorAll('input[name="goal"]').forEach((input) => input.addEventListener("change", () => {
  document.querySelectorAll(".goal-card").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked));
}));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (creating) return;
  if (step === 1 && !validFirstStep()) return;
  if (step < 3) { step += 1; render(); return; }
  const result = validateCaseDetails(values());
  if (!result.ok) {
    step = 1;
    render();
    error.textContent = result.error;
    document.querySelector("#case-title").focus();
    return;
  }
  creating = true;
  form.setAttribute("aria-busy", "true");
  next.disabled = true;
  next.textContent = "Saving on this device…";
  creationError.textContent = "";
  const caseId = createId("case");
  const now = new Date().toISOString();
  try {
    await saveCase({ id: caseId, type: "unpaid_freelance_work", ...result.value, checklist: [], status: "collecting", createdAt: now, updatedAt: now });
    form.classList.add("hidden");
    document.querySelector(".intake-aside").classList.add("hidden");
    const created = document.querySelector("#created-state");
    document.querySelector("#created-title").textContent = result.value.title;
    document.querySelector("#open-workspace").href = `case.html?id=${encodeURIComponent(caseId)}`;
    created.classList.remove("hidden");
    created.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    creationError.textContent = "This private draft could not be saved in this browser. Your entries are still here—check available storage and try again.";
    creationError.focus();
  } finally {
    creating = false;
    form.removeAttribute("aria-busy");
    next.disabled = false;
    if (!form.classList.contains("hidden")) next.innerHTML = 'Create private draft <span aria-hidden="true">→</span>';
  }
});
back.addEventListener("click", () => { if (!creating) { step = Math.max(1, step - 1); render(); } });
document.querySelector("#restart-button").addEventListener("click", () => { form.reset(); step = 1; creating = false; form.removeAttribute("aria-busy"); next.disabled = false; form.classList.remove("hidden"); document.querySelector(".intake-aside").classList.remove("hidden"); document.querySelector("#created-state").classList.add("hidden"); creationError.textContent = ""; updateSummaryCount(); render(); });
updateSummaryCount();
render();
