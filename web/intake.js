const form = document.querySelector("#intake-form");
const summary = document.querySelector("#summary");
const count = document.querySelector("#summary-count");
const error = document.querySelector("#form-error");
const back = document.querySelector("#back-button");
const next = document.querySelector("#continue-button");
const spacer = document.querySelector("#action-spacer");
let step = 1;
function render() {
  document.querySelectorAll(".form-step").forEach((section) => section.classList.toggle("active", Number(section.dataset.step) === step));
  document.querySelector("#step-label").textContent = `Step ${step} of 3`;
  document.querySelector("#step-progress").style.width = `${step * 33.333}%`;
  document.querySelectorAll("[data-step-indicator]").forEach((item) => { const itemStep = Number(item.dataset.stepIndicator); item.classList.toggle("active", itemStep <= step); item.querySelector(":scope > span").textContent = itemStep < step ? "✓" : String(itemStep); });
  back.classList.toggle("hidden", step === 1); spacer.classList.toggle("hidden", step > 1);
  next.innerHTML = step === 3 ? 'Create private draft <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>'; error.textContent = "";
}
function validFirstStep() { const title = document.querySelector("#case-title").value.trim(); const client = document.querySelector("#client").value.trim(); const details = summary.value.trim(); if (title.length < 3 || client.length < 2 || details.length < 30) { error.textContent = "Add a case title, client name, and at least 30 characters describing what happened."; return false; } return true; }
summary.addEventListener("input", () => { const length = summary.value.trim().length; count.textContent = `${length}/30 minimum characters`; count.className = length >= 30 ? "valid" : "hint"; });
document.querySelectorAll('input[name="goal"]').forEach((input) => input.addEventListener("change", () => { document.querySelectorAll(".goal-card").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked)); }));
form.addEventListener("submit", (event) => { event.preventDefault(); if (step === 1 && !validFirstStep()) return; if (step < 3) { step += 1; render(); return; } form.classList.add("hidden"); document.querySelector(".intake-aside").classList.add("hidden"); const created = document.querySelector("#created-state"); document.querySelector("#created-title").textContent = document.querySelector("#case-title").value.trim(); created.classList.remove("hidden"); created.scrollIntoView({ behavior: "smooth", block: "start" }); });
back.addEventListener("click", () => { step = Math.max(1, step - 1); render(); });
document.querySelector("#restart-button").addEventListener("click", () => { form.reset(); step = 1; form.classList.remove("hidden"); document.querySelector(".intake-aside").classList.remove("hidden"); document.querySelector("#created-state").classList.add("hidden"); count.textContent = "0/30 minimum characters"; count.className = "hint"; render(); });
render();
