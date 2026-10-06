import { buildShellHref } from "../evidencespace-shell-model.js";
import { casesFixture, caseFixture } from "./fixtures.js";
import { escapeHtml, icon, miniCaseMap, pill, statePage } from "./page-utils.js";

const filterTokens = (item) => ["all", item.needsYou ? "needs" : "", item.shared ? "shared" : ""].filter(Boolean).join(" ");
const searchText = (item) => escapeHtml(`${item.title} ${item.focus} ${item.type} ${item.jurisdiction} ${item.status}`.toLowerCase());
const nextHref = (item) =>
  item.id === caseFixture.id
    ? buildShellHref("evidence", item.id, { evidenceId: "E-04", from: "cases" })
    : buildShellHref("brief", item.id);

function pinnedCard(item) {
  return `
    <article class="es-pinned-case" data-case-card data-filter="${filterTokens(item)}" data-search="${searchText(item)}">
      <div class="es-pinned-copy">
        <div class="es-card-top">${pill(item.status, item.tone)}<span>${escapeHtml(item.updated)}</span></div>
        <h3><a data-route-link href="${buildShellHref("brief", item.id)}">${escapeHtml(item.title)}</a></h3>
        <p class="es-muted">${escapeHtml(item.type)} · ${escapeHtml(item.jurisdiction)}</p>
        <div class="es-focus-block is-compact"><span>Open question</span><strong>${escapeHtml(item.focus)}</strong><p>${escapeHtml(item.focusNote)}</p></div>
        <a class="es-text-link es-card-action" data-route-link href="${nextHref(item)}">${escapeHtml(item.action)} ${icon("chevron")}</a>
      </div>
      ${miniCaseMap({ caseId: item.id, compact: true, origin: "cases", label: `How ${item.title} connects` })}
    </article>`;
}

function caseRow(item) {
  return `
    <tr data-case-row data-filter="${filterTokens(item)}" data-search="${searchText(item)}">
      <th scope="row"><a data-route-link href="${buildShellHref("brief", item.id)}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.type)} · ${escapeHtml(item.jurisdiction)}</span></th>
      <td>${pill(item.status, item.tone)}</td>
      <td><span class="es-cell-label">Open question</span>${escapeHtml(item.focus)}</td>
      <td><span class="es-cell-label">Next step</span><a class="es-text-link" data-route-link href="${nextHref(item)}">${escapeHtml(item.action)}</a></td>
      <td><span class="es-cell-label">People</span><span class="es-member-count">${item.members}</span></td>
      <td class="es-cell-quiet">${escapeHtml(item.updated)}</td>
    </tr>`;
}

export function renderPage({ caseId, viewState }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Cases",
      state: viewState,
      primaryHref: buildShellHref(viewState === "empty" ? "new-case" : "home", caseId),
      primaryLabel: viewState === "empty" ? "Start a case" : "Return home",
    });
  }

  const pinned = casesFixture.filter((item) => item.pinned);
  const needs = casesFixture.filter((item) => item.needsYou).length;
  const shared = casesFixture.filter((item) => item.shared).length;
  return `
    <section class="es-product-page es-cases-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><h1 id="page-title" tabindex="-1">Cases</h1><p>${casesFixture.length} cases, ${needs} waiting on you.</p></div>
        <a class="es-button is-primary" data-route-link href="${buildShellHref("new-case", caseId)}">${icon("plus")} Start a case</a>
      </header>

      <div class="es-case-controls" role="search">
        <label class="es-search-field">${icon("search")}<span class="es-sr-only">Search cases</span><input id="case-search" type="search" placeholder="Search by name, place or question" autocomplete="off"></label>
        <div class="es-segmented" role="group" aria-label="Show">
          <button type="button" data-case-filter="all" aria-pressed="true">All cases <span>${casesFixture.length}</span></button>
          <button type="button" data-case-filter="needs" aria-pressed="false">Needs you <span>${needs}</span></button>
          <button type="button" data-case-filter="shared" aria-pressed="false">Shared <span>${shared}</span></button>
        </div>
      </div>

      <section aria-labelledby="pinned-title" class="es-pinned-section">
        <h2 id="pinned-title" class="es-section-title">Pinned</h2>
        <div class="es-pinned-grid">${pinned.map(pinnedCard).join("")}</div>
      </section>

      <section class="es-case-table-card" aria-labelledby="active-cases-title">
        <div class="es-section-heading"><h2 id="active-cases-title">All cases</h2><span id="case-result-count" aria-live="polite">${casesFixture.length} shown</span></div>
        <div class="es-table-wrap">
          <table class="es-data-table es-case-table">
            <thead><tr><th scope="col">Case</th><th scope="col">Status</th><th scope="col">Open question</th><th scope="col">Next step</th><th scope="col">People</th><th scope="col">Updated</th></tr></thead>
            <tbody>${casesFixture.map(caseRow).join("")}</tbody>
          </table>
        </div>
        <div class="es-no-results" id="case-no-results" hidden><strong>No cases match</strong><p>Try a shorter word, or <button type="button" class="es-inline-button" id="clear-case-search">clear the search</button>.</p></div>
      </section>
    </section>`;
}

export function mountPage({ root, announce, initialQuery }) {
  const search = root.querySelector("#case-search");
  const filterButtons = [...root.querySelectorAll("[data-case-filter]")];
  const records = [...root.querySelectorAll("[data-case-row], [data-case-card]")];
  const rows = [...root.querySelectorAll("[data-case-row]")];
  const count = root.querySelector("#case-result-count");
  const noResults = root.querySelector("#case-no-results");
  const clear = root.querySelector("#clear-case-search");
  if (!search || !count || !noResults) return undefined;
  let activeFilter = "all";

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    for (const record of records) {
      const matchesFilter = (record.dataset.filter || "").split(" ").includes(activeFilter);
      const matchesSearch = !query || (record.dataset.search || "").includes(query);
      record.hidden = !(matchesFilter && matchesSearch);
    }
    const shown = rows.filter((row) => !row.hidden).length;
    count.textContent = `${shown} shown`;
    noResults.hidden = shown !== 0;
  };

  search.addEventListener("input", apply);
  clear?.addEventListener("click", () => {
    search.value = "";
    apply();
    search.focus();
  });
  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.caseFilter;
      for (const candidate of filterButtons) candidate.setAttribute("aria-pressed", String(candidate === button));
      apply();
      announce(`Showing ${button.firstChild.textContent.trim().toLowerCase()}.`);
    });
  }
  if (initialQuery) {
    search.value = initialQuery;
    apply();
  }
  return undefined;
}
