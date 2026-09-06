export const GLOBAL_DESTINATIONS = Object.freeze([
  Object.freeze({ id: "home", label: "Home" }),
  Object.freeze({ id: "cases", label: "Cases" }),
  Object.freeze({ id: "new-case", label: "New case" }),
  Object.freeze({ id: "lawyers", label: "Lawyers" }),
  Object.freeze({ id: "notifications", label: "Notifications" }),
  Object.freeze({ id: "support", label: "Security/help" }),
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

function cards(first, second, third) {
  return Object.freeze([Object.freeze(first), Object.freeze(second), Object.freeze(third)]);
}

const ROUTES = Object.freeze({
  home: Object.freeze({
    id: "home",
    kind: "global",
    group: "Workspace",
    globalDestination: "home",
    title: "Your workspace",
    description: "Stay oriented across cases without blending restricted matter content or turning attention into an outcome score.",
    primary: Object.freeze({ label: "Open cases", route: "cases" }),
    cards: cards(
      { meta: "Continuity", title: "Return to exact context", body: "The shell keeps route and case context explicit so later deep links can return to the same authorized object." },
      { meta: "Attention", title: "Review, do not predict", body: "Processing failures, approvals, deadlines, and access changes can be surfaced without implying who will win." },
      { meta: "Privacy", title: "Scope stays visible", body: "Cross-case summaries remain a target capability and require explicit authorization before case content is combined." },
    ),
    scope: "This first slice implements the tokenized shell and route ownership only. Cloud workspaces, cross-case summaries, and synchronization are not connected yet.",
  }),
  cases: Object.freeze({
    id: "cases",
    kind: "global",
    group: "Workspace",
    globalDestination: "cases",
    title: "Cases",
    description: "Find and manage authorized matters through an accessible list baseline with explicit lifecycle and recovery states.",
    primary: Object.freeze({ label: "New case", route: "new-case" }),
    cards: cards(
      { meta: "Baseline", title: "Accessible list first", body: "Grid presentation may follow, but keyboard and screen-reader access cannot depend on a spatial layout." },
      { meta: "Lifecycle", title: "Recoverable by design", body: "Archive, restore, and permanent deletion remain separate operations with clear consequences and receipts." },
      { meta: "Authorization", title: "No title leakage", body: "A request-access state must not reveal the title or details of a case the current actor cannot read." },
    ),
    scope: "The EvidenceSpace case library is not connected in this shell slice. The existing CaseFind library remains available while migration is designed.",
  }),
  "new-case": Object.freeze({
    id: "new-case",
    kind: "global",
    group: "Workspace",
    globalDestination: "new-case",
    title: "New case",
    description: "Turn a user-owned narrative into a reviewed case draft while preserving a manual path when AI or storage is unavailable.",
    primary: Object.freeze({ label: "Open current local case creator", href: "/cases-new.html" }),
    cards: cards(
      { meta: "Story Field", title: "Narrative stays user-owned", body: "Questions should reduce effort without replacing the original account or silently changing its meaning." },
      { meta: "Fallback", title: "AI is optional", body: "A person can skip unknowns and create a case manually when assistance is unavailable or unwanted." },
      { meta: "Recovery", title: "Drafts survive failure", body: "Entered text and confirmed answers must survive retryable storage, network, and provider interruptions." },
    ),
    scope: "The link opens the current local CaseFind creator. The target Story Field, account boundary, and cloud draft journal are not implemented here.",
  }),
  lawyers: Object.freeze({
    id: "lawyers",
    kind: "global",
    group: "Professional support",
    globalDestination: "lawyers",
    title: "Find a lawyer",
    description: "Compare professional support using visible jurisdiction, verification scope, price, availability, and sponsored placement.",
    primary: Object.freeze({ label: "Return home", route: "home" }),
    cards: cards(
      { meta: "Verification", title: "Scope and date first", body: "A verified marker will require documented checks, licensed jurisdiction, scope, and revalidation date." },
      { meta: "Matching", title: "Relevance is explainable", body: "Recommendations and paid placement remain distinct; the product must not present sponsorship as suitability." },
      { meta: "Access", title: "Sharing is selective", body: "Payment never grants case access. A consultation package requires explicit objects, permissions, expiry, and review." },
    ),
    scope: "Marketplace, verification, booking, payment, and selective sharing are target capabilities and are not active in this shell foundation.",
  }),
  notifications: Object.freeze({
    id: "notifications",
    kind: "global",
    group: "Attention",
    globalDestination: "notifications",
    title: "Notifications",
    description: "Review grouped, privacy-safe attention items and return to their exact authorized origin.",
    primary: Object.freeze({ label: "Return home", route: "home" }),
    cards: cards(
      { meta: "Origin", title: "Exact-object return", body: "A notification should restore its case, object, and useful backlink rather than opening only a generic page." },
      { meta: "Privacy", title: "Safe outside the app", body: "Operating-system previews default to generic wording and never include case titles, filenames, or source quotes." },
      { meta: "Ownership", title: "One unread count", body: "Unread counts belong to the global Bell. Delivery settings never imitate notification state." },
    ),
    scope: "The unread value is synthetic shell data. Durable notifications, drawers, operating-system delivery, and exact-object replay are not connected.",
  }),
  support: Object.freeze({
    id: "support",
    kind: "global",
    group: "Safety and support",
    globalDestination: "support",
    title: "Security and help",
    description: "Separate product support, privacy and security recovery, urgent safety resources, and professional assistance.",
    primary: Object.freeze({ label: "Return home", route: "home" }),
    cards: cards(
      { meta: "Recovery", title: "Explain what is safe", body: "Errors state what happened, what was saved, what was unchanged, and whether retry is safe." },
      { meta: "Security", title: "No case content in diagnostics", body: "Support and crash paths use privacy-safe metadata unless a separate consented workflow is provided." },
      { meta: "Boundaries", title: "Help is not legal advice", body: "Product education, urgent resources, and licensed professional support remain clearly separated." },
    ),
    scope: "Support, service status, incident response, and privacy-request workflows are not connected in this shell foundation.",
  }),
  settings: Object.freeze({
    id: "settings",
    kind: "global",
    group: "Preferences",
    globalDestination: "settings",
    title: "Settings",
    description: "Manage durable personal, workspace, privacy, security, accessibility, AI, notification, history, and billing controls.",
    primary: Object.freeze({ label: "Return home", route: "home" }),
    cards: cards(
      { meta: "Appearance", title: "System, Light, and Dark", body: "System follows the operating-system theme. An explicit Light or Dark choice disables automatic switching." },
      { meta: "Accessibility", title: "Preferences remain durable", body: "Motion, contrast, density, readability, and keyboard guidance are user choices rather than role guesses." },
      { meta: "Administration", title: "History stays first-class", body: "Workspace history records proposals, approvals, sharing, corrections, failures, recovery, and safe undo receipts." },
    ),
    scope: "Theme tokens respond to the operating-system preference. Persisted account settings and workspace administration are not implemented yet.",
  }),
  account: Object.freeze({
    id: "account",
    kind: "global",
    group: "Identity",
    globalDestination: "account",
    title: "Account",
    description: "Keep account identity, case-visible identity, sessions, workspace membership, and professional status as separate concepts.",
    primary: Object.freeze({ label: "Return home", route: "home" }),
    cards: cards(
      { meta: "Identity", title: "Private by default", body: "Account profile values do not automatically become public or visible inside every case." },
      { meta: "Sessions", title: "Recovery is explicit", body: "Session expiry, device removal, recovery, and sign-out will invalidate access and account-bound cache safely." },
      { meta: "Roles", title: "Labels are not proof", body: "A selected working mode can personalize language but cannot verify a professional license or organization role." },
    ),
    scope: "Authentication, recovery, sessions, and account-bound cache are the next vertical slice; they are not connected in this shell foundation.",
  }),
  brief: Object.freeze({
    id: "brief",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Brief",
    description: "Review the situation, disclosed organization progress, deadlines, contrary material, unknowns, and one justified next step.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "Understanding", title: "Situation, not a verdict", body: "The Brief summarizes accepted context and source-backed proposals without predicting outcome, guilt, or liability." },
      { meta: "Progress", title: "Inputs stay disclosed", body: "Progress reflects review, organization, open questions, tasks, deadlines, and research freshness." },
      { meta: "Next step", title: "One reasoned action", body: "A recommendation names its source basis, alternatives, uncertainty, and the user-controlled action it suggests." },
    ),
    scope: "Case data and AI briefing are not connected. This route establishes stable case context and navigation ownership only.",
  }),
  space: Object.freeze({
    id: "space",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Space",
    description: "Organize canonical case objects and typed relations while keeping truth, access, and provenance independent of visual placement.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "Canvas", title: "Placement is not truth", body: "A card references one domain object. Copying or moving it never duplicates evidence or grants source access." },
      { meta: "Relations", title: "Connections need labels", body: "Supports, contradicts, mentions, sequence, ownership, and task dependencies remain explicit reviewable types." },
      { meta: "Accessibility", title: "Outline equivalence", body: "Every board object and relation requires a structured keyboard and screen-reader path before the board is complete." },
    ),
    scope: "The board engine, operation model, structured outline, collaboration, and persistence remain Decision required after measured spikes.",
  }),
  evidence: Object.freeze({
    id: "evidence",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Evidence",
    description: "Inspect immutable originals, separate derivatives, exact locators, processing state, permissions, and history.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "Original", title: "Bytes remain immutable", body: "Metadata edits, OCR, previews, redactions, and exports create or reference derivatives; they never rewrite the original." },
      { meta: "Provenance", title: "Locators stay reachable", body: "Accepted facts, events, AI findings, board cards, and reports resolve to the exact source version and location." },
      { meta: "Recovery", title: "Broken links fail closed", body: "Changed, deleted, stale, malformed, or unauthorized sources block derived claims and provide a repair path." },
    ),
    scope: "The current CaseFind upload and processing pipeline remains the proven migration source. It is not yet connected to this target shell.",
  }),
  research: Object.freeze({
    id: "research",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Research",
    description: "Build a reviewable external source ledger with authority, jurisdiction, dates, freshness, excerpts, and limitations.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "Authority", title: "Primary sources first", body: "Official law, binding decisions, and authoritative guidance remain distinct from secondary analysis and general web pages." },
      { meta: "Freshness", title: "Current as of is evidence", body: "Published, updated, accessed, and jurisdiction dates stay visible so stale research cannot appear silently current." },
      { meta: "Boundary", title: "Research is not user evidence", body: "A search result becomes a saved research object only after deliberate capture with provenance and scope." },
    ),
    scope: "Research providers, source archiving, citation verification, and AI summaries are not connected in this shell foundation.",
  }),
  work: Object.freeze({
    id: "work",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Work",
    description: "Track tasks and requested information with status, priority, owner, deadline, instructions, and supporting objects.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "Ownership", title: "Every task has an actor", body: "Assignee, state, deadline, requested source, and dependencies remain explicit and permission checked." },
      { meta: "AI", title: "Suggestions stay unapplied", body: "AI may propose tasks, but a person reviews destination, visibility, sources, impact, and recovery before creation." },
      { meta: "Continuity", title: "Supporting context follows", body: "Tasks link to the same evidence, research, issue, board object, and Room thread rather than duplicating them." },
    ),
    scope: "Task storage, assignments, reminders, and conversions are not connected in this shell foundation.",
  }),
  room: Object.freeze({
    id: "room",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Room",
    description: "Coordinate through human-authored messages, threads, decisions, and explicitly labeled shared Case AI.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "People first", title: "Authorship stays clear", body: "Shared AI never impersonates a member, and private AI does not appear in the Room without explicit publication." },
      { meta: "Conversion", title: "Preview destination and visibility", body: "Turning a message into a task, note, decision, evidence candidate, or report note requires review." },
      { meta: "Revocation", title: "Access changes converge", body: "Realtime replay, summaries, caches, and notifications must stop exposing content after permission loss." },
    ),
    scope: "Realtime delivery, presence, threads, shared AI, and revocation propagation remain target capabilities.",
  }),
  reports: Object.freeze({
    id: "reports",
    kind: "case",
    group: "Case lens",
    globalDestination: "cases",
    title: "Reports",
    description: "Assemble reviewed outputs while keeping sources, omissions, disputes, private state, redactions, and AI involvement visible.",
    primary: Object.freeze({ label: "Return to cases", route: "cases" }),
    cards: cards(
      { meta: "Manifest", title: "Inputs are immutable", body: "A report version records the exact permission-checked source revisions and generator details used to build it." },
      { meta: "Review", title: "Draft is not approved", body: "AI may draft; only an authorized person can approve, export, or share after a fresh integrity check." },
      { meta: "Disclosure", title: "Omissions remain visible", body: "Stale, disputed, unresolved, private, or restricted material is excluded or prominently disclosed." },
    ),
    scope: "The current local report logic remains a migration asset. Target report manifests, redaction, versions, and sharing are not connected here.",
  }),
});

const NOT_FOUND_ROUTE = Object.freeze({
  id: "not-found",
  kind: "system",
  group: "Navigation",
  globalDestination: null,
  title: "Page not found",
  description: "This shell route is not recognized. Nothing was changed, and it is safe to return to the workspace.",
  primary: Object.freeze({ label: "Return home", route: "home" }),
  cards: cards(
    { meta: "Status", title: "No workspace change", body: "Opening an unknown route does not create, edit, share, or delete any case object." },
    { meta: "Recovery", title: "Use a known destination", body: "Return Home or choose an available destination from the global navigation." },
    { meta: "Safety", title: "Untrusted values stay inert", body: "Route and case parameters are validated before they are shown or added to navigation links." },
  ),
  scope: "The requested route was rejected by the shell route registry.",
});

export function normalizeCaseId(rawCaseId) {
  const value = String(rawCaseId || "C-03").trim();
  return /^[a-z0-9][a-z0-9-]{0,39}$/i.test(value) ? value : "C-03";
}

export function resolveShellRoute(rawRoute) {
  const value = String(rawRoute || "home").trim().toLowerCase();
  return ROUTES[value] || NOT_FOUND_ROUTE;
}

export function buildShellHref(routeId, rawCaseId) {
  const route = resolveShellRoute(routeId);
  const safeRoute = route.id === "not-found" ? "home" : route.id;
  const params = new URLSearchParams({ route: safeRoute });
  if (route.kind === "case") params.set("case", normalizeCaseId(rawCaseId));
  return `/evidencespace-shell.html?${params.toString()}`;
}
