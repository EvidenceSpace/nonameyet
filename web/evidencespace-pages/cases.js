import { buildShellHref } from "../evidencespace-shell-model.js";
import { casesFixture, caseFixture } from "./fixtures.js";
import { escapeHtml, icon, membersMarkup, miniCaseMap, pill, statePage } from "./page-utils.js";

function pinnedCard(item) {
  return `
    <article class="es-pinned-case" data-case-card data-filter="${item.id === caseFixture.id ? "needs mine shared" : "mine shared"}" data-search="${escapeHtml(`${item.title} ${item.focus} ${item.jurisdiction}`.toLowerCase())}">
      <div class="es-pinned-copy">
        <div class="es-inline-meta"><span>Pinned case</span><span>Updated ${escapeHtml(item.updated)} ago</span></div>
        <h3><a data-route-link href="${buildShellHref("brief", item.id)}">${escapeHtml(item.title)}</a></h3>
        <p class="es-muted">${escapeHtml(item.type)} · ${escapeHtml(item.jurisdiction)}</p>
        <div class="es-focus-block is-compact"><span>Current focus</span><strong>${escapeHtml(item.focus)}</strong><p>${item.id === caseFixture.id ? "Review whether the objection began before or after delivery." : "One document request is ready for approval."}</p></div>
        <div class="es-card-footer"><a data-route-link href="${buildShellHref("brief", item.id)}">${item.id === caseFixture.id ? "Review one source" : "Review AI draft"}</a><span>${item.members} members</span></div>
      </div>
      ${miniCaseMap({ caseId: item.id, compact: true })}
    </article>`;
}

function caseRow(item) {
  return `
    <tr data-case-row data-filter="${item.id === caseFixture.id ? "needs mine shared" : item.pinned ? "mine shared" : "mine"}" data-search="${escapeHtml(`${item.title} ${item.focus} ${item.jurisdiction} ${item.status}`.toLowerCase())}">
      <th scope="row"><a data-route-link href="${buildShellHref("brief", item.id)}">${escapeHtml(item.title)}</a><span>${escapeHtml(item.type)} · ${escapeHtml(item.jurisdiction)}</span></th>
      <td>${pill(item.status, item.tone)}</td>
      <td><span class="es-cell-label">Focus</span>${escapeHtml(item.focus)}</td>
      <td><span class="es-cell-label">Next</span><a data-route-link href="${item.id === caseFixture.id ? buildShellHref("evidence", item.id, { evidenceId: "E-04", from: "cases" }) : buildShellHref("brief", item.id)}">${escapeHtml(item.action)}</a></td>
      <td><span class="es-member-count" aria-label="${item.members} members">${item.members}</span></td>
      <td>${escapeHtml(item.updated)}</td>
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
  return `
    <section class="es-product-page es-cases-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div><p class="es-eyebrow">Workspace library</p><h1 id="page-title" tabindex="-1">Cases</h1><p>Find a case and continue from its current focus.</p></div>
        <div class="es-header-status">${pill("4 active", "action")}${pill("1 needs you", "contrary")}${pill("2 shared", "confirmed")}</div>
      </header>

      <div class="es-case-controls" role="search">
        <label class="es-search-field">${icon("search")}<span class="es-sr-only">Search cases</span><input id="case-search" type="search" placeholder="Search cases, people, or jurisdictions"></label>
        <div class="es-filter-tabs" aria-label="Filter cases">
          <button type="button" data-case-filter="all" aria-pressed="true">All cases <span>4</span></button>
          <button type="button" data-case-filter="needs" aria-pressed="false">Needs you <span>1</span></button>
          <button type="button" data-case-filter="mine" aria-pressed="false">Mine <span>4</span></button>
          <button type="button" data-case-filter="shared" aria-pressed="false">Shared <span>2</span></button>
        </div>
        <button class="es-sort-button" type="button">${icon("sort")} Updated recently</button>
      </div>

      <section aria-labelledby="pinned-title">
        <div class="es-section-heading"><h2 id="pinned-title">Pinned</h2><span>Your most important cases</span></div>
        <div class="es-pinned-grid">${pinned.map(pinnedCard).join("")}</div>
      </section>

      <section class="es-case-table-card" aria-labelledby="active-cases-title">
        <div class="es-section-heading"><div><h2 id="active-cases-title">All active cases</h2><span id="case-result-count">${casesFixture.length} shown</span></div><span>Accessible list</span></div>
        <div class="es-table-wrap">
          <table class="es-data-table es-case-table">
            <thead><tr><th>Case</th><th>Status</th><th>Current focus</th><th>Next action</th><th>Members</th><th>Updated</th></tr></thead>
            <tbody>${casesFixture.map(caseRow).join("")}</tbody>
          </table>
        </div>
        <p class="es-no-results" id="case-no-results" hidden>No cases match this search.</p>
      </section>
    </section>`;
}

export function mountPage({ root, announce }) {
  const search = root.querySelector("#case-search");
  const filterButtons = [...root.querySelectorAll("[data-case-filter]")];
  const records = [...root.querySelectorAll("[data-case-row], [data-case-card]")];
  const rows = [...root.querySelectorAll("[data-case-row]")];
  const count = root.querySelector("#case-result-count");
  const noResults = root.querySelector("#case-no-results");
  if (!search || !count || !noResults) return undefined;
  let activeFilter = "all";

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    for (const record of records) {
      const filters = record.dataset.filter || "";
      const matchesFilter = activeFilter === "all" || filters.split(" ").includes(activeFilter);
      const matchesSearch = !query || (record.dataset.search || "").includes(query);
      record.hidden = !(matchesFilter && matchesSearch);
    }
    const shown = rows.filter((row) => !row.hidden).length;
    count.textContent = `${shown} shown`;
    noResults.hidden = shown !== 0;
  };

  search.addEventListener("input", apply);
  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.caseFilter;
      for (const candidate of filterButtons) candidate.setAttribute("aria-pressed", String(candidate === button));
      apply();
      announce(`${button.textContent.trim()} filter applied.`);
    });
  }
  return undefined;
}
