export const GLOBAL_DESTINATIONS = Object.freeze([
  Object.freeze({ id: "home", label: "Home" }),
  Object.freeze({ id: "cases", label: "Cases" }),
  Object.freeze({ id: "new-case", label: "New case" }),
  Object.freeze({ id: "lawyers", label: "Lawyers" }),
  Object.freeze({ id: "notifications", label: "Notifications" }),
  Object.freeze({ id: "support", label: "Security and help" }),
  Object.freeze({ id: "settings", label: "Settings" }),
  Object.freeze({ id: "account", label: "Account" }),
]);

export const CASE_LENSES = Object.freeze([
  Object.freeze({ id: "brief", label: "Brief" }),
  Object.freeze({ id: "space", label: "Space" }),
  Object.freeze({ id: "evidence", label: "Evidence" }),
  Object.freeze({ id: "research", label: "Research" }),
  Object.freeze({ id: "work", label: "Work" }),
  Object.freeze({ id: "room", label: "Room" }),
  Object.freeze({ id: "reports", label: "Reports" }),
]);

export const PRODUCT_PAGE_IDS = Object.freeze(["home", "cases", "brief", "evidence"]);

const route = (id, kind, title, group, globalDestination, options = {}) =>
  Object.freeze({ id, kind, title, group, globalDestination, ...options });

export const ROUTES = Object.freeze({
  home: route("home", "global", "Home", "Workspace", "home", { productPage: true }),
  cases: route("cases", "global", "Cases", "Workspace", "cases", { productPage: true }),
  "new-case": route("new-case", "global", "New case", "Workspace", "new-case"),
  lawyers: route("lawyers", "global", "Find a lawyer", "Professional support", "lawyers"),
  notifications: route("notifications", "global", "Notifications", "Attention", "notifications"),
  support: route("support", "global", "Security and help", "Support", "support"),
  settings: route("settings", "global", "Settings", "Preferences", "settings"),
  account: route("account", "global", "Account", "Identity", "account"),
  brief: route("brief", "case", "Brief", "Case", "cases", { productPage: true }),
  space: route("space", "case", "Space", "Case", "cases"),
  evidence: route("evidence", "case", "Evidence", "Case", "cases", { productPage: true }),
  research: route("research", "case", "Research", "Case", "cases"),
  work: route("work", "case", "Work", "Case", "cases"),
  room: route("room", "case", "Room", "Case", "cases"),
  reports: route("reports", "case", "Reports", "Case", "cases"),
});

const NOT_FOUND_ROUTE = route("not-found", "system", "Page not found", "Navigation", null);
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,39}$/i;
const SAFE_ORIGINS = new Set(["home", "cases", "brief", "space", "evidence"]);
const VIEW_STATES = new Set(["ready", "loading", "empty", "denied", "error"]);

function normalizeId(value, fallback) {
  const normalized = String(value || fallback).trim();
  return SAFE_ID.test(normalized) ? normalized : fallback;
}

export function normalizeCaseId(rawCaseId) {
  return normalizeId(rawCaseId, "C-03");
}

export function normalizeEvidenceId(rawEvidenceId) {
  return normalizeId(rawEvidenceId, "E-04");
}

export function normalizeContextId(rawContextId) {
  if (!rawContextId) return null;
  const value = String(rawContextId).trim();
  return SAFE_ID.test(value) ? value : null;
}

export function normalizeOrigin(rawOrigin) {
  const value = String(rawOrigin || "").trim().toLowerCase();
  return SAFE_ORIGINS.has(value) ? value : null;
}

export function normalizeViewState(rawState) {
  const value = String(rawState || "ready").trim().toLowerCase();
  return VIEW_STATES.has(value) ? value : "ready";
}

export function resolveShellRoute(rawRoute) {
  const value = String(rawRoute || "home").trim().toLowerCase();
  return ROUTES[value] || NOT_FOUND_ROUTE;
}

export function parseShellLocation(search = "") {
  const params = new URLSearchParams(search);
  const route = resolveShellRoute(params.get("route"));
  return Object.freeze({
    route,
    caseId: normalizeCaseId(params.get("case")),
    evidenceId: normalizeEvidenceId(params.get("evidence")),
    contextId: normalizeContextId(params.get("context")),
    from: normalizeOrigin(params.get("from")),
    viewState: normalizeViewState(params.get("view")),
  });
}

export function buildShellHref(routeId, rawCaseId, options = {}) {
  const route = resolveShellRoute(routeId);
  const safeRoute = route.id === "not-found" ? ROUTES.home : route;
  const params = new URLSearchParams({ route: safeRoute.id });
  if (safeRoute.kind === "case") params.set("case", normalizeCaseId(rawCaseId));
  if (safeRoute.id === "evidence" && options.evidenceId) {
    params.set("evidence", normalizeEvidenceId(options.evidenceId));
  }
  if (options.contextId) {
    const contextId = normalizeContextId(options.contextId);
    if (contextId) params.set("context", contextId);
  }
  if (options.from) {
    const from = normalizeOrigin(options.from);
    if (from) params.set("from", from);
  }
  if (options.viewState && normalizeViewState(options.viewState) !== "ready") {
    params.set("view", normalizeViewState(options.viewState));
  }
  return `?${params.toString()}`;
}

export function isProductPage(routeId) {
  return PRODUCT_PAGE_IDS.includes(resolveShellRoute(routeId).id);
}
