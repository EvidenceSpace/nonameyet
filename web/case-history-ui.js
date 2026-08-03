import { describeEmptyCaseLibrary, noteLocalCaseStored, readLocalCaseHistory } from "./case-history-model.js";

const empty = document.querySelector("#library-empty");
const grid = document.querySelector("#case-grid");

function renderEmptyState() {
  let history = readLocalCaseHistory();
  if (grid.querySelector(".local-case-card") && !history) {
    noteLocalCaseStored();
    history = readLocalCaseHistory();
  }
  if (empty.hidden) return;
  const state = describeEmptyCaseLibrary(Boolean(history));
  empty.dataset.state = state.state;
  if (state.state === "history") {
    empty.innerHTML = `<span class="empty-mark" aria-hidden="true">◇</span><span class="empty-history-eyebrow">${state.eyebrow}</span><h2>${state.title}</h2><p>${state.detail}</p><p class="empty-history-explanation">${state.explanation}</p><p class="empty-history-instruction">${state.instruction}</p><div><a class="button" href="cases-new.html#restore">${state.primaryLabel}</a><a class="button-secondary" href="cases-new.html">Create a new case</a></div>`;
    return;
  }
  empty.innerHTML = `<span class="empty-mark" aria-hidden="true">◇</span><h2>${state.title}</h2><p>${state.detail}</p><div><a class="button" href="cases-new.html">${state.primaryLabel}</a><a class="button-secondary" href="cases-new.html#restore">Restore backup</a></div>`;
}

const observer = new MutationObserver(renderEmptyState);
observer.observe(empty, { attributes: true, attributeFilter: ["hidden"] });
observer.observe(grid, { childList: true });
renderEmptyState();
