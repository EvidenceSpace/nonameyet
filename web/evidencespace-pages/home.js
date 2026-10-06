import { buildShellHref } from "../evidencespace-shell-model.js";
import { casesFixture, caseFixture, peopleFixture, todayFixture, upcomingFixture, workspaceFixture } from "./fixtures.js";
import { escapeHtml, icon, miniCaseMap, pill, statePage } from "./page-utils.js";

const nextHref = (item, origin) =>
  item.id === caseFixture.id
    ? buildShellHref("evidence", item.id, { evidenceId: "E-04", from: origin })
    : buildShellHref("brief", item.id);

function caseRows() {
  return casesFixture.slice(0, 3).map((item) => `
    <tr>
      <th scope="row">
        <a data-route-link href="${buildShellHref("brief", item.id)}">${escapeHtml(item.title)}</a>
        <span>${escapeHtml(item.type)} · ${escapeHtml(item.jurisdiction)}</span>
      </th>
      <td>${pill(item.status, item.tone)}</td>
      <td><a class="es-text-link" data-route-link href="${nextHref(item, "home")}">${escapeHtml(item.action)}</a></td>
      <td class="es-cell-quiet">${escapeHtml(item.updatedShort)}</td>
    </tr>`).join("");
}

function todayItem(item) {
  const href = item.caseId === caseFixture.id
    ? buildShellHref("evidence", item.caseId, { evidenceId: "E-04", from: "home" })
    : buildShellHref("brief", item.caseId);
  return `
    <li>
      <time>${escapeHtml(item.time)}</time>
      <span class="es-list-icon" data-tone="${escapeHtml(item.tone)}">${icon(item.icon)}</span>
      <a data-route-link href="${href}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.caseTitle)}</span></a>
    </li>`;
}

export function renderPage({ caseId, viewState }) {
  if (viewState !== "ready") {
    return statePage({
      title: "Home",
      state: viewState,
      primaryHref: buildShellHref(viewState === "empty" ? "new-case" : "cases", caseId),
      primaryLabel: viewState === "empty" ? "Start a case" : "Open cases",
    });
  }

  const briefHref = buildShellHref("brief", caseFixture.id);
  const evidenceHref = buildShellHref("evidence", caseFixture.id, { evidenceId: "E-04", from: "home" });
  const resume = casesFixture[0];
  return `
    <section class="es-product-page es-home-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div>
          <p class="es-date-line">${escapeHtml(workspaceFixture.today)}</p>
          <h1 id="page-title" tabindex="-1">Good afternoon, ${escapeHtml(workspaceFixture.firstName)}.</h1>
        </div>
        <p class="es-header-note"><span class="es-dot" data-tone="confirmed" aria-hidden="true"></span> Everything is saved</p>
      </header>

      <div class="es-home-layout">
        <div class="es-home-main">
          <article class="es-resume-card" aria-labelledby="resume-title">
            <div class="es-resume-copy">
              <p class="es-quiet-line">You were here 8 minutes ago</p>
              <h2 id="resume-title">${escapeHtml(caseFixture.title)}</h2>
              <p class="es-muted">${escapeHtml(caseFixture.type)} · ${escapeHtml(caseFixture.jurisdiction)} · ${escapeHtml(caseFixture.amount)} unpaid</p>
              <div class="es-focus-block">
                <span>Open question</span>
                <strong>${escapeHtml(caseFixture.focus)}</strong>
                <p>${escapeHtml(resume.focusNote)}</p>
              </div>
              <div class="es-button-row">
                <a class="es-button is-primary" data-route-link href="${briefHref}">Resume case</a>
                <a class="es-button" data-route-link data-vt="E-04" href="${evidenceHref}">Read the 2 August email</a>
              </div>
              <p class="es-since">${icon("comment")} <span>${escapeHtml(peopleFixture.riley.firstName)} left a question while you were away.</span></p>
            </div>
            <div class="es-resume-map">
              ${miniCaseMap({ caseId: caseFixture.id, compact: true, origin: "home" })}
            </div>
          </article>

          <section class="es-table-section" aria-labelledby="your-cases-title">
            <div class="es-section-heading">
              <h2 id="your-cases-title">Your cases</h2>
              <a class="es-text-link" data-route-link href="${buildShellHref("cases", caseId)}">All ${casesFixture.length} cases</a>
            </div>
            <div class="es-table-wrap">
              <table class="es-data-table">
                <thead><tr><th scope="col">Case</th><th scope="col">Status</th><th scope="col">Next step</th><th scope="col"><span class="es-sr-only">Last </span>Updated</th></tr></thead>
                <tbody>${caseRows()}</tbody>
              </table>
            </div>
          </section>
        </div>

        <aside class="es-home-side" aria-label="Your day">
          <section class="es-side-card" aria-labelledby="today-title">
            <div class="es-section-heading"><h2 id="today-title">Today</h2><span>${todayFixture.length} things</span></div>
            <ol class="es-today-list">${todayFixture.map(todayItem).join("")}</ol>
          </section>

          <section class="es-side-card" aria-labelledby="upcoming-title">
            <div class="es-section-heading"><h2 id="upcoming-title">Coming up</h2></div>
            <ul class="es-upcoming-list">
              ${upcomingFixture.map((item) => `<li><span class="es-date-chip" data-tone="${escapeHtml(item.tone)}">${escapeHtml(item.date)}</span><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.caseTitle)}</span></div></li>`).join("")}
            </ul>
          </section>

          <a class="es-side-link" data-route-link href="${buildShellHref("new-case", caseId)}">${icon("plus")}<span><strong>Start a new case</strong><small>Describe what happened in your own words.</small></span>${icon("chevron")}</a>
        </aside>
      </div>
    </section>`;
}

export function mountPage() {
  return undefined;
}
