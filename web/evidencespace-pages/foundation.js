import { buildShellHref } from "../evidencespace-shell-model.js";
import { escapeHtml, icon } from "./page-utils.js";

export function renderPage({ route, caseId }) {
  const destination = route.kind === "case" ? buildShellHref("brief", caseId) : buildShellHref("home", caseId);
  const destinationLabel = route.kind === "case" ? "Open Brief" : "Return home";
  return `
    <section class="es-coming-page" aria-labelledby="page-title">
      <header class="es-view-header">
        <div>
          <p class="es-eyebrow">${escapeHtml(route.group)}</p>
          <h1 id="page-title" tabindex="-1">${escapeHtml(route.title)}</h1>
          <p>This connected page is planned, but its product UI is not ready to review yet.</p>
        </div>
      </header>
      <div class="es-coming-card">
        <span class="es-coming-icon">${icon("layers")}</span>
        <div>
          <h2>Kept in the app, built in its own slice</h2>
          <p>The shared navigation and case context are working. This page will be added from its approved source screen instead of filled with placeholder cards.</p>
          <a class="es-button is-primary" data-route-link href="${destination}">${destinationLabel}</a>
        </div>
      </div>
    </section>`;
}
