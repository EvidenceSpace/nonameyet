import {
  CASE_LENSES,
  GLOBAL_DESTINATIONS,
  buildShellHref,
  normalizeCaseId,
  resolveShellRoute,
} from "./evidencespace-shell-model.js";

const params = new URLSearchParams(window.location.search);
const route = resolveShellRoute(params.get("route"));
const caseId = normalizeCaseId(params.get("case"));

const main = document.querySelector("#main-content");
const caseContext = document.querySelector("#case-context");
const caseIdentity = document.querySelector("#case-id");
const pageEyebrow = document.querySelector("#page-eyebrow");
const pageTitle = document.querySelector("#page-title");
const pageDescription = document.querySelector("#page-description");
const topbarKicker = document.querySelector("#topbar-kicker");
const topbarTitle = document.querySelector("#topbar-title");
const primaryAction = document.querySelector("#primary-action");
const scopeDescription = document.querySelector("#foundation-description");
const routeStatus = document.querySelector("#route-status");

for (const destination of GLOBAL_DESTINATIONS) {
  const link = document.querySelector(`[data-global-route="${destination.id}"]`);
  if (!link) continue;
  link.href = buildShellHref(destination.id, caseId);
  link.removeAttribute("aria-current");
  link.dataset.active = "false";
}

for (const link of document.querySelectorAll("[data-topbar-route]")) {
  link.href = buildShellHref(link.dataset.topbarRoute, caseId);
}

const activeGlobalId = route.kind === "case" ? "cases" : route.globalDestination;
if (activeGlobalId) {
  const activeGlobal = document.querySelector(`[data-global-route="${activeGlobalId}"]`);
  activeGlobal.dataset.active = "true";
  activeGlobal.setAttribute("aria-current", route.kind === "case" ? "location" : "page");
}

if (route.kind === "case") {
  caseContext.hidden = false;
  caseIdentity.textContent = caseId;
  for (const lens of CASE_LENSES) {
    const link = document.querySelector(`[data-case-route="${lens.id}"]`);
    link.href = buildShellHref(lens.id, caseId);
    if (lens.id === route.id) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
} else {
  caseContext.hidden = true;
}

pageEyebrow.textContent = route.kind === "case" ? `Case ${caseId}` : route.group;
pageTitle.textContent = route.title;
pageDescription.textContent = route.description;
topbarKicker.textContent = route.kind === "case" ? `Case ${caseId}` : route.group;
topbarTitle.textContent = route.title;
scopeDescription.textContent = route.scope;
main.dataset.route = route.id;

primaryAction.textContent = route.primary.label;
primaryAction.href = route.primary.href || buildShellHref(route.primary.route, caseId);

for (const [index, card] of route.cards.entries()) {
  const cardElement = document.querySelector(`[data-card-index="${index}"]`);
  cardElement.querySelector("[data-card-meta]").textContent = card.meta;
  cardElement.querySelector("[data-card-title]").textContent = card.title;
  cardElement.querySelector("[data-card-body]").textContent = card.body;
}

document.title = `${route.title} — EvidenceSpace`;
document.body.dataset.ready = "true";
routeStatus.textContent = `${route.title} route ready.`;
