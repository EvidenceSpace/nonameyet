import {
  CASE_LENSES,
  GLOBAL_DESTINATIONS,
  buildShellHref,
  normalizeOrigin,
  parseShellLocation,
} from "./evidencespace-shell-model.js";
import { caseFixture, casesFixture, evidenceFixture, peopleFixture, selectedEvidenceFixture, timelineFixture, workspaceFixture } from "./evidencespace-pages/fixtures.js";
import { escapeHtml, icon, membersMarkup, pill } from "./evidencespace-pages/page-utils.js";

const pageContent = document.querySelector("#page-content");
const pageLoading = document.querySelector("#page-loading");
const main = document.querySelector("#main-content");
const ribbon = document.querySelector("#case-ribbon");
const topbarNav = document.querySelector("#topbar-nav");
const topbarTitle = document.querySelector("#topbar-title");
const topbarSubtitle = document.querySelector("#topbar-subtitle");
const topbarMark = document.querySelector("#topbar-mark");
const globalSearch = document.querySelector("#global-search");
const globalSearchInput = document.querySelector("#global-search-input");
const caseSearchShortcut = document.querySelector("#case-search-shortcut");
const caseMembers = document.querySelector("#case-members");
const contextLens = document.querySelector("#context-lens");
const contextScrim = document.querySelector("#context-scrim");
const routeStatus = document.querySelector("#route-status");
const toastElement = document.querySelector("#toast");
const toastTitle = document.querySelector("#toast-title");
const toastMessage = document.querySelector("#toast-message");
const toastAction = document.querySelector("#toast-action");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const pageLoaders = Object.freeze({
  home: () => import("./evidencespace-pages/home.js"),
  cases: () => import("./evidencespace-pages/cases.js"),
  brief: () => import("./evidencespace-pages/brief.js"),
  space: () => import("./evidencespace-pages/space.js"),
  evidence: () => import("./evidencespace-pages/evidence.js"),
});
const foundationLoader = () => import("./evidencespace-pages/foundation.js");

let cleanupPage;
let ribbonCollapsed = false;
let contextReturnFocus;
let pendingCaseQuery = "";
let renderVersion = 0;
let toastTimer;
let toastHandler;
window.__evidenceSpaceBootId ||= `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function announce(message) {
  routeStatus.textContent = "";
  requestAnimationFrame(() => {
    routeStatus.textContent = message;
  });
}

function hideToast() {
  toastElement.classList.remove("is-visible");
  window.setTimeout(() => {
    if (!toastElement.classList.contains("is-visible")) toastElement.hidden = true;
  }, 180);
}

function toast(title, message, { actionLabel, onAction } = {}) {
  clearTimeout(toastTimer);
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toastHandler = onAction;
  toastAction.hidden = !onAction;
  toastAction.textContent = actionLabel || "Undo";
  toastElement.hidden = false;
  requestAnimationFrame(() => toastElement.classList.add("is-visible"));
  toastTimer = window.setTimeout(hideToast, onAction ? 6500 : 4000);
}

toastAction.addEventListener("click", () => {
  const handler = toastHandler;
  toastHandler = undefined;
  clearTimeout(toastTimer);
  hideToast();
  handler?.();
});

const caseRecord = (caseId) => casesFixture.find((item) => item.id === caseId);
const initialsOf = (title) => title.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

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

function renderTopbar(location) {
  const isCase = location.route.kind === "case";
  const isRestricted = isCase && location.viewState === "denied";
  const record = caseRecord(location.caseId);
  const title = isRestricted ? "Restricted case" : isCase ? record?.title || "Case" : workspaceFixture.name;
  topbarTitle.textContent = title;
  topbarSubtitle.textContent = isRestricted ? "Access required" : isCase ? (record ? `${record.type} · ${record.jurisdiction}` : "Not found") : workspaceFixture.kind;
  topbarMark.textContent = isRestricted ? "–" : initialsOf(title);
  topbarMark.dataset.kind = isCase ? "case" : "workspace";
  caseMembers.innerHTML = isCase && !isRestricted && location.caseId === caseFixture.id ? membersMarkup() : "";
  topbarNav.hidden = !isCase;
  topbarNav.innerHTML = isCase
    ? CASE_LENSES.map((item) => {
      const current = item.id === location.route.id;
      return `<a data-route-link href="${buildShellHref(item.id, location.caseId)}" ${current ? 'aria-current="page"' : ""}>${escapeHtml(item.label)}</a>`;
    }).join("")
    : "";
  globalSearch.hidden = isCase;
  caseSearchShortcut.hidden = !isCase || isRestricted;
  document.querySelector(".es-topbar-context").href = isCase ? buildShellHref("brief", location.caseId) : buildShellHref("home", location.caseId);
  document.querySelector(".es-topbar-context").setAttribute("aria-label", isCase ? `${title}, open Brief` : "Open workspace home");
}

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const dayNumber = (label) => {
  const [day, month] = label.split(" ");
  return Date.UTC(2026, MONTHS[month], Number(day)) / 86400000;
};
function gapLabel(days) {
  if (days >= 14) return `${Math.round(days / 7)} weeks`;
  return days === 1 ? "1 day" : `${days} days`;
}

function renderRibbon(location) {
  const show = location.route.kind === "case" && location.viewState !== "denied" && location.caseId === caseFixture.id;
  if (!show) {
    ribbon.innerHTML = "";
    ribbon.hidden = true;
    return;
  }
  ribbon.hidden = false;
  const collapsed = ribbonCollapsed;
  const origin = normalizeOrigin(location.route.id) || undefined;
  const items = timelineFixture.map((event, index) => {
    const previous = timelineFixture[index - 1];
    const gap = previous ? `<span class="es-ribbon-gap" aria-hidden="true">${gapLabel(dayNumber(event.date) - dayNumber(previous.date))}</span>` : "";
    const current = location.route.id === "evidence" && event.ref === location.evidenceId;
    const body = `<time>${escapeHtml(event.date)}</time><span>${escapeHtml(event.label)}</span>`;
    const target = event.ref
      ? `<a data-route-link data-vt="${escapeHtml(event.ref)}" href="${buildShellHref("evidence", location.caseId, { evidenceId: event.ref, from: origin })}" ${current ? 'aria-current="true"' : ""} aria-label="${escapeHtml(`${event.date}: ${event.label}, ${event.ref}`)}">${body}</a>`
      : `<span class="es-ribbon-today">${body}</span>`;
    return `<li data-tone="${escapeHtml(event.tone)}">${gap}${target}</li>`;
  }).join("");
  ribbon.innerHTML = `
    <nav class="es-ribbon" aria-label="Key dates" data-collapsed="${collapsed}">
      <button class="es-ribbon-toggle" type="button" aria-expanded="${!collapsed}" aria-controls="ribbon-list">${icon("calendar")}<span>Key dates</span>${icon("chevron-down", "es-icon es-ribbon-chevron")}</button>
      <div class="es-ribbon-track" id="ribbon-list" ${collapsed ? "hidden" : ""}><ol>${items}</ol></div>
    </nav>`;
  ribbon.querySelector(".es-ribbon-toggle").addEventListener("click", (event) => {
    const nav = ribbon.querySelector(".es-ribbon");
    const nowCollapsed = nav.dataset.collapsed !== "true";
    nav.dataset.collapsed = String(nowCollapsed);
    event.currentTarget.setAttribute("aria-expanded", String(!nowCollapsed));
    ribbon.querySelector("#ribbon-list").hidden = nowCollapsed;
    ribbonCollapsed = nowCollapsed;
  });
}

function contextMarkup(location, item) {
  const closeHref = buildShellHref(location.route.id, location.caseId, {
    evidenceId: location.route.id === "evidence" ? location.evidenceId : undefined,
    from: location.from,
    viewState: location.viewState,
  });
  const isMain = item.id === selectedEvidenceFixture.id;
  const origin = normalizeOrigin(location.route.id) || undefined;
  const sourceHref = buildShellHref("evidence", location.caseId, { evidenceId: item.id, from: origin === "evidence" ? location.from : origin });
  const addedBy = item.owner === "You" ? peopleFixture.user.name : peopleFixture.riley.name;
  return `
    <header class="es-context-header">
      <div><p class="es-context-ref">${escapeHtml(item.id)} · ${escapeHtml(item.kind)}</p><h2 id="context-title">${escapeHtml(item.label)}</h2></div>
      <a class="es-icon-button" data-route-link data-route-replace data-context-close href="${closeHref}" aria-label="Close details">${icon("close")}</a>
    </header>
    <div class="es-context-tabs" role="tablist" aria-label="Details sections">
      <button role="tab" aria-selected="true" aria-controls="context-panel-details" id="context-tab-details">Details</button>
      <button role="tab" aria-selected="false" aria-controls="context-panel-comments" id="context-tab-comments" tabindex="-1">Comments <span>2</span></button>
      <button role="tab" aria-selected="false" aria-controls="context-panel-activity" id="context-tab-activity" tabindex="-1">Activity</button>
    </div>
    <div class="es-context-body">
      <section role="tabpanel" id="context-panel-details" aria-labelledby="context-tab-details">
        ${pill(item.state, item.tone)}
        <dl class="es-context-list">
          <div><dt>File</dt><dd>${escapeHtml(item.title)}</dd></div>
          <div><dt>Dated</dt><dd>${escapeHtml(isMain ? selectedEvidenceFixture.date : item.date)}</dd></div>
          <div><dt>Added by</dt><dd>${escapeHtml(addedBy)}</dd></div>
          <div><dt>Who can see it</dt><dd>People on this case</dd></div>
        </dl>
        ${isMain ? `<div class="es-context-assessment"><h3>What this means</h3><p>${escapeHtml(selectedEvidenceFixture.assessment)}</p></div>
        <div class="es-suggestion-card" id="context-suggestion">
          <p class="es-suggestion-label">${icon("spark")} Suggested · not added</p>
          <h3>Ask Mia for the list of changes</h3>
          <p>It would answer one open question: was a list of changes ever sent?</p>
          <div class="es-button-row"><button class="es-button is-primary is-small" type="button" data-context-accept>Add to Work</button><button class="es-button is-quiet is-small" type="button" data-context-dismiss>Not now</button></div>
        </div>` : ""}
        ${location.route.id === "evidence" && location.evidenceId === item.id ? "" : `<a class="es-button es-context-source-link" data-route-link data-vt="${escapeHtml(item.id)}" href="${sourceHref}">${icon("file")} Open in Evidence</a>`}
      </section>
      <section role="tabpanel" id="context-panel-comments" aria-labelledby="context-tab-comments" hidden>
        <ul class="es-comment-list">
          <li><span class="es-avatar">${escapeHtml(peopleFixture.riley.initials)}</span><div><p><strong>${escapeHtml(peopleFixture.riley.name)}</strong><time>Today 12:47</time></p><p>Did Mia mention the layouts on the call? If she did, the concern is older than this email.</p></div></li>
          <li><span class="es-avatar">${escapeHtml(peopleFixture.jordan.initials)}</span><div><p><strong>${escapeHtml(peopleFixture.jordan.name)}</strong><time>Yesterday</time></p><p>Linked this to the acceptance question so it shows up in the Brief.</p></div></li>
        </ul>
      </section>
      <section role="tabpanel" id="context-panel-activity" aria-labelledby="context-tab-activity" hidden>
        <ol class="es-activity-list">
          <li><time>2 Aug, 10:22</time><p><strong>Added by ${escapeHtml(peopleFixture.riley.firstName)}</strong><span>Original kept as received</span></p></li>
          <li><time>2 Aug, 10:24</time><p><strong>Passages marked</strong><span>A1, A2 and A3</span></p></li>
          <li><time>Today, 12:47</time><p><strong>${escapeHtml(peopleFixture.riley.firstName)} commented</strong><span>On the timing of the concern</span></p></li>
        </ol>
      </section>
    </div>`;
}

function bindContext() {
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
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.click();
      next.focus();
    });
  }
  const card = contextLens.querySelector("#context-suggestion");
  if (!card) return;
  const restore = card.innerHTML;
  const bindCard = () => {
    card.querySelector("[data-context-accept]")?.addEventListener("click", () => {
      card.classList.add("is-accepted");
      card.innerHTML = `<p class="es-suggestion-label is-added">${icon("check")} Added to Work</p><h3>W-01 · Ask Mia for the list of changes</h3><p>Due 2 September. Linked to this email.</p>`;
      announce("Added to Work as W-01.");
      toast("Added to Work", "W-01 · Ask Mia for the list of changes", {
        actionLabel: "Undo",
        onAction: () => {
          card.classList.remove("is-accepted");
          card.innerHTML = restore;
          bindCard();
        },
      });
    });
    card.querySelector("[data-context-dismiss]")?.addEventListener("click", () => {
      card.hidden = true;
      toast("Suggestion hidden", "You can bring it back.", {
        actionLabel: "Undo",
        onAction: () => { card.hidden = false; },
      });
    });
  };
  bindCard();
}

function renderContext(location, shouldFocus) {
  const item = location.contextId && evidenceFixture.find((candidate) => candidate.id === location.contextId);
  const open = Boolean(item) && location.route.kind === "case" && location.viewState === "ready" && location.caseId === caseFixture.id;
  contextLens.hidden = !open;
  contextScrim.hidden = !open;
  document.body.dataset.contextOpen = String(open);
  if (!open) {
    contextLens.innerHTML = "";
    return;
  }
  contextLens.innerHTML = contextMarkup(location, item);
  bindContext();
  if (shouldFocus) contextLens.querySelector("[data-context-close]")?.focus({ preventScroll: true });
}

function routeLinkLabel(link) {
  return (link.getAttribute("aria-label") || link.textContent || "").replace(/\s+/g, " ").trim();
}

function rememberContextOrigin(link) {
  const url = new URL(link.href, window.location.href);
  const destination = parseShellLocation(url.search);
  if (!destination.contextId || link.hasAttribute("data-context-close")) return;
  contextReturnFocus = {
    routeId: destination.route.id,
    href: link.getAttribute("href") || `${url.search}${url.hash}`,
    label: routeLinkLabel(link),
  };
}

function restoreContextOrigin(location) {
  const target = contextReturnFocus;
  contextReturnFocus = undefined;
  if (!target || target.routeId !== location.route.id) return false;
  const origin = [...pageContent.querySelectorAll("a[data-route-link]")].find((link) =>
    link.getAttribute("href") === target.href && routeLinkLabel(link) === target.label,
  );
  if (!origin) return false;
  origin.focus({ preventScroll: true });
  return true;
}

function notFoundMarkup() {
  return `<section class="es-state-page" aria-labelledby="page-title"><div class="es-state-icon">${icon("warning")}</div><h1 id="page-title" tabindex="-1">Page not found</h1><p>That address isn’t part of EvidenceSpace. Nothing changed.</p><a class="es-button is-primary" data-route-link href="${buildShellHref("home", "C-03")}">Return home</a></section>`;
}

function samePage(previous, location) {
  return previous && previous.route.id === location.route.id && previous.caseId === location.caseId && previous.viewState === location.viewState
    && (location.route.id !== "evidence" || previous.evidenceId === location.evidenceId);
}

let lastLocation;
async function renderPage({ focus = false } = {}) {
  const version = ++renderVersion;
  const location = parseShellLocation(window.location.search);
  const previous = lastLocation;
  lastLocation = location;
  renderRail(location);
  renderTopbar(location);
  renderRibbon(location);

  /* Opening or closing the details panel keeps the page underneath as it is. */
  if (samePage(previous, location) && pageContent.querySelector("#page-title")) {
    renderContext(location, focus && Boolean(location.contextId));
    if (focus && !location.contextId) restoreContextOrigin(location);
    return;
  }

  cleanupPage?.();
  cleanupPage = undefined;
  main.removeAttribute("aria-labelledby");
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
      const initialQuery = pendingCaseQuery;
      pendingCaseQuery = "";
      cleanupPage = module.mountPage?.({ root: pageContent, location, announce, toast, initialQuery });
    }
    document.title = `${location.route.title} — EvidenceSpace`;
    main.dataset.route = location.route.id;
    main.scrollTo({ top: 0, behavior: "auto" });
    const pageTitle = pageContent.querySelector("#page-title");
    if (pageTitle) main.setAttribute("aria-labelledby", "page-title");
    renderContext(location, focus && Boolean(location.contextId));
    if (focus && !location.contextId && !restoreContextOrigin(location)) {
      pageTitle?.focus({ preventScroll: true });
    }
    announce(`${location.route.title} page loaded.`);
  } catch {
    contextReturnFocus = undefined;
    pageContent.innerHTML = `<section class="es-state-page" aria-labelledby="page-title"><div class="es-state-icon">${icon("warning")}</div><h1 id="page-title" tabindex="-1">This page couldn’t load</h1><p>Nothing changed. Reload the page or return home.</p><a class="es-button is-primary" data-route-link href="${buildShellHref("home", location.caseId)}">Return home</a></section>`;
    main.setAttribute("aria-labelledby", "page-title");
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
    return Promise.resolve();
  }
  const method = replace ? "replaceState" : "pushState";
  history[method]({}, "", `${url.pathname}${url.search}${url.hash}`);
  return renderPage({ focus });
}

/*
 * Shared-element motion: the object you clicked travels to where it lands
 * on the next page (a map node into Evidence, a Brief reference into the
 * viewer). Skipped entirely when the system asks for reduced motion.
 */
function navigateWithTransition(link, options) {
  const objectId = link.dataset.vt;
  if (!objectId || !document.startViewTransition || reduceMotion.matches) return navigate(link.href, options);
  link.style.viewTransitionName = "es-shared-object";
  const transition = document.startViewTransition(async () => {
    link.style.viewTransitionName = "";
    await navigate(link.href, options);
    const target = pageContent.querySelector(`[data-vt-target="${CSS.escape(objectId)}"]`);
    if (target) target.style.viewTransitionName = "es-shared-object";
  });
  transition.finished.finally(() => {
    for (const element of document.querySelectorAll("[data-vt-target]")) element.style.viewTransitionName = "";
  });
  return transition.updateCallbackDone;
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route-link]");
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  rememberContextOrigin(link);
  event.preventDefault();
  navigateWithTransition(link, { replace: link.hasAttribute("data-route-replace"), focus: true });
});

function preload(event) {
  const link = event.target.closest?.("a[data-route-link]");
  if (!link) return;
  const target = parseShellLocation(new URL(link.href, window.location.href).search).route.id;
  pageLoaders[target]?.();
}
document.addEventListener("pointerover", preload);
document.addEventListener("focusin", preload);

globalSearch.addEventListener("submit", (event) => {
  event.preventDefault();
  pendingCaseQuery = globalSearchInput.value.trim();
  globalSearchInput.value = "";
  globalSearchInput.blur();
  const location = parseShellLocation(window.location.search);
  if (location.route.id === "cases") {
    const field = pageContent.querySelector("#case-search");
    if (field) {
      field.value = pendingCaseQuery;
      pendingCaseQuery = "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.focus();
      return;
    }
  }
  navigate(buildShellHref("cases", location.caseId), { focus: true });
});

async function openCaseSearch() {
  const location = parseShellLocation(window.location.search);
  if (location.route.id !== "evidence") {
    await navigate(buildShellHref("evidence", location.caseId, { evidenceId: location.evidenceId, from: normalizeOrigin(location.route.id) || undefined }), { focus: false });
  }
  pageContent.querySelector("#source-search")?.focus();
}
caseSearchShortcut.addEventListener("click", openCaseSearch);

contextScrim.addEventListener("click", () => {
  const location = parseShellLocation(window.location.search);
  navigate(buildShellHref(location.route.id, location.caseId, { evidenceId: location.route.id === "evidence" ? location.evidenceId : undefined, from: location.from }), { replace: true, focus: true });
});

window.addEventListener("popstate", () => renderPage({ focus: true }));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !contextLens.hidden) {
    contextLens.querySelector("[data-context-close]")?.click();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (!globalSearch.hidden) globalSearchInput.focus();
    else if (!caseSearchShortcut.hidden) openCaseSearch();
  }
});

document.documentElement.dataset.platform = /Mac|iPhone|iPad/.test(navigator.platform) ? "mac" : "other";
if (document.documentElement.dataset.platform === "mac") document.querySelector(".es-global-search kbd").textContent = "⌘K";

renderPage({ focus: false });
