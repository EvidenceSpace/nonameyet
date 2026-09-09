import { buildShellHref } from "../evidencespace-shell-model.js";
import { casesFixture, caseFixture, todayFixture, workspaceFixture } from "./fixtures.js";
import { escapeHtml, icon, membersMarkup, miniCaseMap, pill, statePage } from "./page-utils.js";

function caseRows(caseId) {
  return casesFixture.slice(0, 3).map((item) => `
    <tr>
      <th scope="row">
        <a data-route-link href="${buildShellHref("brief", item.id)}">${escapeHtml(item.title)}</a>
        <span>${escapeHtml(item.type)} · ${escapeHtml(item.jurisdiction)}</span>
      </th>
      <td>${pill(item.status, item.tone)}</td>
      <td><a data-route-link href="${item.id === caseId ? buildShellHref("evidence", item.id, { evidenceId: "E-04", from: "home" }) : buildShellHref("brief", item.id)}">${escapeHtml(item.action)}</a></td>
      <td>${escapeHtml(item.updated)}</td>
    </tr>`).join("");
}

export function renderPage({ caseId, viewState }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Home",
      state: viewState,
      primaryHref: buildShellHref("cases", caseId),
      primaryLabel: viewState === "empty" ? "Create your first case" : "Open cases",
    });
  }

  const briefHref = buildShellHref("brief", caseFixture.id);
  const evidenceHref = buildShellHref("evidence", caseFixture.id, { evidenceId: "E-04", from: "home" });
  return `
    <section class="es-product-page es-home-page" aria-labelledby="page-title">
      <header class="es-view-header es-home-heading">
        <div>
          <p class="es-eyebrow">Friday · 28 August</p>
          <h1 id="page-title" tabindex="-1">Good afternoon, ${escapeHtml(workspaceFixture.firstName)}.</h1>
          <p>Pick up where your work needs you.</p>
        </div>
        <div class="es-header-status" aria-label="Workspace status">
          ${pill("All synchronized", "confirmed")}
          <span>${icon("bell")} ${workspaceFixture.updates} updates</span>
        </div>
      </header>

      <div class="es-home-layout">
        <div class="es-home-main">
          <article class="es-resume-card">
            <div class="es-resume-copy">
              <div class="es-inline-meta">${pill("Continue", "action")}<span>Last opened 8 minutes ago</span></div>
              <h2>${escapeHtml(caseFixture.title)}</h2>
              <p class="es-muted">${escapeHtml(caseFixture.type)} · ${escapeHtml(caseFixture.jurisdiction)}</p>
              <div class="es-focus-block">
                <span>Current focus</span>
                <strong>${escapeHtml(caseFixture.focus)}</strong>
                <p>Check whether the quality concern came before or after delivery was accepted.</p>
              </div>
              <div class="es-button-row">
                <a class="es-button is-primary" data-route-link href="${briefHref}">Resume case</a>
                <a class="es-button" data-route-link href="${evidenceHref}">Review E-04</a>
              </div>
              <p class="es-since"><strong>Since you left:</strong> Riley added one comment. No evidence status changed.</p>
            </div>
            <div class="es-resume-map">
              <span class="es-object-count">${icon("link")} ${caseFixture.connectedObjects} connected objects</span>
              ${miniCaseMap({ caseId: caseFixture.id, compact: true })}
            </div>
          </article>

          <section class="es-table-section" aria-labelledby="your-cases-title">
            <div class="es-section-heading">
              <h2 id="your-cases-title">Your cases</h2>
              <a data-route-link href="${buildShellHref("cases", caseId)}">View all ${casesFixture.length}</a>
            </div>
            <div class="es-table-wrap">
              <table class="es-data-table">
                <thead><tr><th>Case</th><th>Status</th><th>Next action</th><th>Updated</th></tr></thead>
                <tbody>${caseRows(caseFixture.id)}</tbody>
              </table>
            </div>
          </section>
        </div>

        <aside class="es-home-side" aria-label="Today and quick actions">
          <section class="es-side-card">
            <div class="es-section-heading"><div><p class="es-eyebrow">Today</p><h2>Three things need you</h2></div><span>28 Aug</span></div>
            <ol class="es-today-list">
              ${todayFixture.map((item) => `
                <li>
                  <time>${escapeHtml(item.time)}</time>
                  <span class="es-list-icon" data-tone="${escapeHtml(item.tone)}">${icon(item.icon)}</span>
                  <a data-route-link href="${item.tone === "contrary" ? evidenceHref : buildShellHref("brief", caseFixture.id)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.caseTitle)}</span></a>
                </li>`).join("")}
            </ol>
          </section>

          <section class="es-side-card es-ask-card">
            <p class="es-eyebrow">Ask across your workspace</p>
            <h2>What needs attention?</h2>
            <p>Search your cases or ask Private AI. Nothing changes without review.</p>
            <label class="es-ask-field">${icon("spark")}<span class="es-sr-only">Ask or find something</span><input type="text" placeholder="Ask or find something…"><kbd>⌘ Enter</kbd></label>
          </section>

          <section class="es-side-card">
            <div class="es-section-heading"><h2>Quick start</h2><span>No setup maze</span></div>
            <div class="es-quick-grid">
              <a data-route-link href="${buildShellHref("new-case", caseId)}">${icon("plus")}<strong>Start a case</strong></a>
              <a data-route-link href="${evidenceHref}">${icon("file")}<strong>Add evidence</strong></a>
            </div>
          </section>
        </aside>
      </div>
    </section>`;
}

export function mountPage() {
  return undefined;
}
