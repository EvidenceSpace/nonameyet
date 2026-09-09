import {
  CASE_LENSES,
  GLOBAL_DESTINATIONS,
  ROUTES,
  buildShellHref,
  parseShellLocation,
} from "./evidencespace-shell-model.js";
import { caseFixture, selectedEvidenceFixture, workspaceFixture } from "./evidencespace-pages/fixtures.js";
import { escapeHtml, icon, membersMarkup, pill } from "./evidencespace-pages/page-utils.js";

const pageContent = document.querySelector("#page-content");
const pageLoading = document.querySelector("#page-loading");
const main = document.querySelector("#main-content");
const topbarNav = document.querySelector("#topbar-nav");
const topbarTitle = document.querySelector("#topbar-title");
const topbarSubtitle = document.querySelector("#topbar-subtitle");
const caseMembers = document.querySelector("#case-members");
const contextLens = document.querySelector("#context-lens");
const contextScrim = document.querySelector("#context-scrim");
const routeStatus = document.querySelector("#route-status");
const toastElement = document.querySelector("#toast");
const toastTitle = document.querySelector("#toast-title");
const toastMessage = document.querySelector("#toast-message");

const pageLoaders = Object.freeze({
  home: () => import("./evidencespace-pages/home.js"),
  cases: () => import("./evidencespace-pages/cases.js"),
  brief: () => import("./evidencespace-pages/brief.js"),
  evidence: () => import("./evidencespace-pages/evidence.js"),
});
const foundationLoader = () => import("./evidencespace-pages/foundation.js");

let cleanupPage;
let renderVersion = 0;
let toastTimer;
window.__evidenceSpaceBootId ||= `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function announce(message) {
  routeStatus.textContent = "";
  requestAnimationFrame(() => {
    routeStatus.textContent = message;
  });
}

function toast(title, message) {
  clearTimeout(toastTimer);
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toastElement.hidden = false;
  requestAnimationFrame(() => toastElement.classList.add("is-visible"));
  toastTimer = window.setTimeout(() => {
    toastElement.classList.remove("is-visible");
    window.setTimeout(() => { toastElement.hidden = true; }, 180);
  }, 3800);
}

function renderRail(location) {
  for (const destination of GLOBAL_DESTINATIONS) {
    const link = document.querySelector(`[data-global-route="${destination.id}"]`);
    if (!link) continue;
    link.href = buildShellHref(destination.id, location.caseId);
    link.removeAttribute("aria-current");
    link.dataset.active = "false";
  }
  const activeId = location.route.kind === "case" ? "cases" : location.route.globalDestination;
  const active = activeId && document.querySelector(`[data-global-route="${activeId}"]`);
  if (active) {
    active.dataset.active = "true";
    active.setAttribute("aria-current", location.route.kind === "case" ? "location" : "page");
  }
}

function navLink(item, location, kind) {
  const current = item.id === location.route.id;
  return `<a data-route-link href="${buildShellHref(item.id, location.caseId)}" ${current ? 'aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
}

function renderTopbar(location) {
  const isCase = location.route.kind === "case";
  const isRestricted = isCase && location.viewState === "denied";
  topbarTitle.textContent = isRestricted ? "Restricted case" : isCase ? caseFixture.title : workspaceFixture.name;
  topbarSubtitle.textContent = isRestricted ? "Access required" : isCase ? `${caseFixture.type} · ${caseFixture.jurisdiction}` : "Personal workspace";
  caseMembers.innerHTML = isCase && !isRestricted ? membersMarkup() : "";
  const links = isCase ? CASE_LENSES : GLOBAL_DESTINATIONS.filter(({ id }) => ["home", "cases", "lawyers"].includes(id));
  topbarNav.innerHTML = links.map((item) => navLink(item, location, isCase ? "case" : "global")).join("");
  document.querySelector(".es-topbar-context").href = isCase ? buildShellHref("brief", location.caseId) : buildShellHref("home", location.caseId);
}

function contextMarkup(location) {
  const closeHref = buildShellHref(location.route.id, location.caseId, {
    evidenceId: location.route.id === "evidence" ? location.evidenceId : undefined,
    from: location.from,
    viewState: location.viewState,
  });
  const sourceHref = buildShellHref("evidence", location.caseId, { evidenceId: "E-04", from: location.route.id });
  return `
    <header class="es-context-header">
      <div><p class="es-eyebrow is-contrary">Selected · E-04</p><h2 id="context-title">${escapeHtml(selectedEvidenceFixture.title)}</h2></div>
      <a class="es-icon-button" data-route-link data-route-replace data-context-close href="${closeHref}" aria-label="Close Context Lens">×</a>
    </header>
    <div class="es-context-tabs" role="tablist" aria-label="Context Lens sections">
      <button role="tab" aria-selected="true" aria-controls="context-panel-details" id="context-tab-details">Details</button>
      <button role="tab" aria-selected="false" aria-controls="context-panel-comments" id="context-tab-comments" tabindex="-1">Comments</button>
      <button role="tab" aria-selected="false" aria-controls="context-panel-activity" id="context-tab-activity" tabindex="-1">Activity</button>
    </div>
    <div class="es-context-body">
      <section role="tabpanel" id="context-panel-details" aria-labelledby="context-tab-details">
        ${pill("Contrary · unresolved", "contrary")}
        <dl class="es-context-list"><div><dt>Source</dt><dd>${escapeHtml(selectedEvidenceFixture.source)}</dd></div><div><dt>Date</dt><dd>2 August</dd></div><div><dt>Original</dt><dd>Headers preserved</dd></div><div><dt>Visibility</dt><dd>${escapeHtml(selectedEvidenceFixture.visibility)}</dd></div><div><dt>Backlinks</dt><dd>${selectedEvidenceFixture.backlinks} connected objects</dd></div></dl>
        <div class="es-context-assessment"><p class="es-record-label">Source-backed assessment</p><p>${escapeHtml(selectedEvidenceFixture.assessment)}</p></div>
        <div class="es-proposal-card"><p class="es-eyebrow">${icon("spark")} AI proposal · Not applied</p><h3>Request the complete change log</h3><p>Create one proposed task linked to the unresolved timing question.</p><div>${pill("3 sources")}${pill("Reversible")}</div><a class="es-button is-primary" data-route-link href="${buildShellHref("work", location.caseId)}">Review in Work</a></div>
        <a class="es-button es-context-source-link" data-route-link href="${sourceHref}">${icon("file")} Open Evidence E-04</a>
      </section>
      <section role="tabpanel" id="context-panel-comments" aria-labelledby="context-tab-comments" hidden><h3>Two comments</h3><p>Riley asked whether the concern came before the delivery acknowledgement.</p><p>Jordan linked the email to the current understanding.</p></section>
      <section role="tabpanel" id="context-panel-activity" aria-labelledby="context-tab-activity" hidden><h3>Recent activity</h3><p>10:22 · Source imported by Riley.</p><p>10:24 · Two statements detected.</p></section>
    </div>`;
}

function bindContextTabs() {
  const tabs = [...contextLens.querySelectorAll('[role="tab"]')];
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const candidate of tabs) {
        const selected = candidate === tab;
        candidate.setAttribute("aria-selected", String(selected));
        candidate.tabIndex = selected ? 0 : -1;
        document.querySelector(`#${candidate.getAttribute("aria-controls")}`).hidden = !selected;
      }
    });
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.click();
      next.focus();
    });
  }
}

function renderContext(location, shouldFocus) {
  const open = location.contextId === "E-04";
  contextLens.hidden = !open;
  contextScrim.hidden = !open;
  document.body.dataset.contextOpen = String(open);
  if (!open) {
    contextLens.innerHTML = "";
    return;
  }
  contextLens.innerHTML = contextMarkup(location);
  bindContextTabs();
  if (shouldFocus) contextLens.querySelector("[data-context-close]")?.focus({ preventScroll: true });
}

function notFoundMarkup() {
  return `<section class="es-state-page" aria-labelledby="page-title"><div class="es-state-icon">${icon("warning")}</div><p class="es-eyebrow">Navigation</p><h1 id="page-title" tabindex="-1">Page not found</h1><p>That address is not part of EvidenceSpace. Nothing changed.</p><a class="es-button is-primary" data-route-link href="${buildShellHref("home", "C-03")}">Return home</a></section>`;
}

async function renderPage({ focus = false } = {}) {
  const version = ++renderVersion;
  const location = parseShellLocation(window.location.search);
  cleanupPage?.();
  cleanupPage = undefined;
  renderRail(location);
  renderTopbar(location);
  pageLoading.setAttribute("aria-hidden", "false");
  pageContent.setAttribute("aria-busy", "true");
  pageContent.innerHTML = "";

  try {
    let module;
    if (location.route.id === "not-found") {
      pageContent.innerHTML = notFoundMarkup();
    } else {
      module = await (pageLoaders[location.route.id] || foundationLoader)();
      if (version !== renderVersion) return;
      pageContent.innerHTML = module.renderPage(location);
      cleanupPage = module.mountPage?.({ root: pageContent, location, announce, toast });
    }
    document.title = `${location.route.title} — EvidenceSpace`;
    main.dataset.route = location.route.id;
    main.scrollTo({ top: 0, behavior: "auto" });
    renderContext(location, focus && Boolean(location.contextId));
    if (focus && !location.contextId) pageContent.querySelector("#page-title")?.focus({ preventScroll: true });
    announce(`${location.route.title} page loaded.`);
  } catch {
    pageContent.innerHTML = `<section class="es-state-page" aria-labelledby="page-title"><div class="es-state-icon">${icon("warning")}</div><p class="es-eyebrow">${escapeHtml(location.route.title)}</p><h1 id="page-title" tabindex="-1">This page couldn’t load</h1><p>Nothing changed. Reload the page or return home.</p><a class="es-button is-primary" data-route-link href="${buildShellHref("home", location.caseId)}">Return home</a></section>`;
    announce(`${location.route.title} could not load. Nothing changed.`);
  } finally {
    if (version === renderVersion) {
      pageLoading.setAttribute("aria-hidden", "true");
      pageContent.setAttribute("aria-busy", "false");
      document.body.dataset.ready = "true";
    }
  }
}

function navigate(href, { replace = false, focus = true } = {}) {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) {
    window.location.assign(url.href);
    return;
  }
  const method = replace ? "replaceState" : "pushState";
  history[method]({}, "", `${url.pathname}${url.search}${url.hash}`);
  renderPage({ focus });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route-link]");
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.href, { replace: link.hasAttribute("data-route-replace"), focus: true });
});

document.addEventListener("pointerover", (event) => {
  const link = event.target.closest("a[data-route-link]");
  if (!link) return;
  const target = parseShellLocation(new URL(link.href, window.location.href).search).route.id;
  pageLoaders[target]?.();
});

document.addEventListener("focusin", (event) => {
  const link = event.target.closest?.("a[data-route-link]");
  if (!link) return;
  const target = parseShellLocation(new URL(link.href, window.location.href).search).route.id;
  pageLoaders[target]?.();
});

contextScrim.addEventListener("click", () => {
  const location = parseShellLocation(window.location.search);
  navigate(buildShellHref(location.route.id, location.caseId, { evidenceId: location.evidenceId, from: location.from }), { replace: true, focus: true });
});

window.addEventListener("popstate", () => renderPage({ focus: true }));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !contextLens.hidden) {
    contextLens.querySelector("[data-context-close]")?.click();
  }
});

renderPage({ focus: false });
