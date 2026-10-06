import { buildShellHref } from "../evidencespace-shell-model.js";
import { caseFixture, caseMapsFixture, casesFixture } from "./fixtures.js";

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
  return `<span class="es-member-stack" aria-label="${members.length} people on this case">${members
    .map((member) => `<span title="${escapeHtml(`${member.name} · ${member.role}`)}">${escapeHtml(member.initials)}</span>`)
    .join("")}</span>`;
}

export const KIND_ICON = Object.freeze({
  source: "file",
  contrary: "mail",
  focus: "question",
  research: "shield",
  suggestion: "spark",
  note: "note",
  work: "check",
});

const NODE_WIDTH = 36;
const NODE_HEIGHT = 20;

function nodeHref(node, caseId, { origin, contextRoute }) {
  if (node.id.startsWith("E-")) {
    if (node.kind === "contrary" && contextRoute) return buildShellHref(contextRoute, caseId, { contextId: node.id });
    return buildShellHref("evidence", caseId, { evidenceId: node.id, from: origin });
  }
  if (node.kind === "research") return buildShellHref("research", caseId);
  if (node.kind === "suggestion") return buildShellHref("space", caseId);
  return buildShellHref("brief", caseId);
}

/*
 * The small connection map used on Home, Cases and Brief.
 * Each case draws its own nodes from caseMapsFixture; lines are computed
 * from node positions, so moving a node in the fixture moves its line.
 */
export function miniCaseMap({ caseId = caseFixture.id, compact = false, origin = "home", contextRoute = null, label } = {}) {
  const map = caseMapsFixture[caseId];
  if (!map) {
    return `<div class="es-case-map is-empty ${compact ? "is-compact" : ""}"><p>No connections yet. Add a source to start the map.</p></div>`;
  }
  const byId = new Map(map.nodes.map((node) => [node.id, node]));
  const centre = (node) => [node.x + NODE_WIDTH / 2, node.y + NODE_HEIGHT / 2];
  const lines = map.edges.map((edge) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return "";
    const [x1, y1] = centre(from);
    const [x2, y2] = centre(to);
    const mid = (x1 + x2) / 2;
    return `<path class="${escapeHtml(edge.type)}" d="M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}"></path>`;
  }).join("");
  const nodes = map.nodes.map((node) => `
      <a class="es-map-node is-${escapeHtml(node.kind)}" data-route-link data-vt="${escapeHtml(node.id)}" href="${nodeHref(node, caseId, { origin, contextRoute })}" style="--x:${node.x}%;--y:${node.y}%">
        <span>${escapeHtml(node.tag)}</span><strong>${escapeHtml(node.title)}</strong>
      </a>`).join("");
  return `
    <div class="es-case-map ${compact ? "is-compact" : ""}" role="group" aria-label="${escapeHtml(label || "How the main sources connect")}">
      <svg class="es-case-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${nodes}
    </div>`;
}

export function statePage({ title, state, primaryHref, primaryLabel }) {
  const copy = {
    loading: ["Loading…", "This usually takes a moment."],
    empty: [`No ${title.toLowerCase()} yet`, "When you add one, it will show up here."],
    denied: ["You don’t have access", "Nothing from this case was shown. Ask the case owner to invite you."],
    error: [`${title} couldn’t load`, "Nothing changed. Try again when you’re ready."],
  }[state];
  if (!copy) return "";
  return `
    <section class="es-state-page" data-state="${escapeHtml(state)}" aria-labelledby="page-title">
      <div class="es-state-icon">${icon(state === "denied" ? "lock" : state === "error" ? "warning" : "info")}</div>
      <h1 id="page-title" tabindex="-1">${escapeHtml(copy[0])}</h1>
      <p>${escapeHtml(copy[1])}</p>
      <a class="es-button is-primary" data-route-link href="${primaryHref}">${escapeHtml(primaryLabel)}</a>
    </section>`;
}

/*
 * Only Harbor Studio (C-03) is fully written for the preview. Other cases
 * say so plainly instead of borrowing Harbor Studio's content.
 */
export function previewLimitPage({ caseId, title, intro = "" }) {
  const record = casesFixture.find((item) => item.id === caseId);
  if (!record) {
    return `
      <section class="es-state-page" aria-labelledby="page-title">
        <div class="es-state-icon">${icon("warning")}</div>
        <h1 id="page-title" tabindex="-1">Case not found</h1>
        <p>There’s no case with that address. Nothing changed.</p>
        <a class="es-button is-primary" data-route-link href="${buildShellHref("cases", caseFixture.id)}">Open cases</a>
      </section>`;
  }
  return `
    <section class="es-product-page es-limit-page" aria-labelledby="page-title">
      <header class="es-view-header"><div><h1 id="page-title" tabindex="-1">${escapeHtml(title)}</h1><p>${escapeHtml(intro || `${record.type} · ${record.jurisdiction} · updated ${record.updated}`)}</p></div></header>
      <article class="es-summary-card">
        <div class="es-summary-copy">
          <div class="es-focus-block"><span>Open question</span><strong>${escapeHtml(record.focus)}</strong><p>${escapeHtml(record.focusNote)}</p></div>
          <p class="es-fine-print">${icon("info")} Only Harbor Studio is filled in for this preview, so the rest of this case is empty.</p>
          <div class="es-button-row"><a class="es-button is-primary" data-route-link href="${buildShellHref("brief", caseFixture.id)}">Open Harbor Studio</a><a class="es-button is-quiet" data-route-link href="${buildShellHref("cases", caseId)}">All cases</a></div>
        </div>
        <div class="es-summary-map">${miniCaseMap({ caseId, origin: "brief" })}</div>
      </article>
    </section>`;
}
