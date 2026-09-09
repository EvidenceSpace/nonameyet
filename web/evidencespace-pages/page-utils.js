import { buildShellHref } from "../evidencespace-shell-model.js";
import { caseFixture } from "./fixtures.js";

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

export function icon(name, className = "es-icon") {
  return `<svg class="${escapeHtml(className)}" aria-hidden="true"><use href="#es-i-${escapeHtml(name)}"></use></svg>`;
}

export function pill(label, tone = "neutral") {
  return `<span class="es-pill" data-tone="${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

export function membersMarkup(members = caseFixture.members) {
  return `<span class="es-member-stack" aria-label="${members.length} case members">${members
    .map((member) => `<span title="${escapeHtml(member.name)}">${escapeHtml(member.initials)}</span>`)
    .join("")}</span>`;
}

export function miniCaseMap({ caseId = caseFixture.id, compact = false, selected = null } = {}) {
  const briefHref = buildShellHref("brief", caseId);
  const evidenceHref = buildShellHref("evidence", caseId, { evidenceId: "E-04", from: "brief" });
  const contextHref = buildShellHref("brief", caseId, { contextId: "E-04" });
  return `
    <div class="es-case-map ${compact ? "is-compact" : ""}" aria-label="Connected case objects">
      <svg class="es-case-map-lines" viewBox="0 0 760 330" preserveAspectRatio="none" aria-hidden="true">
        <path class="supports" d="M138 92 C240 92 245 150 338 158"></path>
        <path class="contradicts" d="M618 70 C518 84 505 135 452 160"></path>
        <path class="research" d="M585 260 C505 250 495 210 448 188"></path>
        <path class="proposal" d="M390 274 C392 235 384 220 378 203"></path>
      </svg>
      <a class="es-map-node is-source" data-route-link href="${briefHref}" style="--x:8%;--y:13%"><span>E-01 · Agreement</span><strong>Payment term</strong></a>
      <a class="es-map-node is-contrary ${selected === "E-04" ? "is-selected" : ""}" data-route-link href="${selected === "E-04" ? evidenceHref : contextHref}" style="--x:67%;--y:7%"><span>E-04 · Contrary</span><strong>Quality concern</strong></a>
      <a class="es-map-node is-focus" data-route-link href="${briefHref}" style="--x:35%;--y:35%"><span>Reviewed understanding</span><strong>Acceptance timing</strong></a>
      <a class="es-map-node is-research" data-route-link href="${buildShellHref("research", caseId)}" style="--x:64%;--y:64%"><span>R-02 · Research</span><strong>Pre-action guidance</strong></a>
      <a class="es-map-node is-proposal" data-route-link href="${buildShellHref("work", caseId)}" style="--x:38%;--y:68%"><span>AI proposal · Not applied</span><strong>Request change log</strong></a>
    </div>`;
}

export function statePage({ title, state, primaryHref, primaryLabel }) {
  const copy = {
    loading: ["Loading this page", "The shared shell is ready. We’re bringing in only the page data you need."],
    empty: [`No ${title.toLowerCase()} yet`, "There is nothing to review here. Start with one clear action."],
    denied: ["You don’t have access", "Nothing private was shown. Ask a case owner if you believe you should have access."],
    error: [`${title} couldn’t load`, "Nothing changed. Try again when you’re ready."],
  }[state];
  if (!copy) return "";
  return `
    <section class="es-state-page" aria-labelledby="page-title">
      <div class="es-state-icon">${icon(state === "denied" ? "lock" : state === "error" ? "warning" : "info")}</div>
      <p class="es-eyebrow">${escapeHtml(title)}</p>
      <h1 id="page-title" tabindex="-1">${escapeHtml(copy[0])}</h1>
      <p>${escapeHtml(copy[1])}</p>
      <a class="es-button is-primary" data-route-link href="${primaryHref}">${escapeHtml(primaryLabel)}</a>
    </section>`;
}
