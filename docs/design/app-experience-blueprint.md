# EvidenceSpace application experience blueprint

**Status:** design foundation for review; not implemented product behavior  
**Design target:** online Windows and macOS desktop application  
**Primary reference size:** 1440 × 900 logical pixels  
**Related contracts:** `docs/product/information-architecture.md`, `docs/product/page-specifications.md`, `docs/product/board-and-ai-copilot.md`, and `docs/design/ux-quality-bar.md`

## 1. Design thesis

EvidenceSpace should feel like a **calm case room with a living evidence map**: spatial enough to reveal relationships, structured enough to remain trustworthy, and quiet enough for long sessions involving sensitive material.

The product does not win by exposing every feature at once. It wins by making the correct action obvious, keeping context visible, and revealing advanced capability at the moment it becomes useful.

The experience promise is:

> Enter with a complicated situation. Leave with preserved sources, a clearer picture, visible uncertainty, and one justified next step.

### Signature qualities

- **Calm authority:** serious without looking bureaucratic or intimidating.
- **Spatial clarity:** the board feels alive and direct, but never decorative or game-like.
- **Source visibility:** evidence, research, inference, and visual notes are distinguishable at a glance.
- **Context continuity:** users resume where they stopped and understand what changed.
- **Human control:** AI proposes visibly; people decide visibly.
- **Adaptive depth:** an individual can begin simply while a professional can reach dense metadata and keyboard workflows.
- **Collaborative without loneliness:** solo work feels complete; team work adds coordination instead of unlocking basic value.

## 2. Lessons from excellent product design—without copying

EvidenceSpace should borrow durable interaction lessons, not another product’s visual identity.

| Product pattern | Lesson to adopt | EvidenceSpace adaptation |
| --- | --- | --- |
| Notion-like calm workspace | Content dominates chrome; commands appear in context | A quiet case surface, progressive metadata, command palette, and direct manipulation |
| GitHub-like state clarity | Status, history, authorship, and deep links are explicit | Every finding, proposal, source, task, and decision exposes state and auditability |
| Figma/Miro-like spatial tools | Tool placement and multiplayer presence are predictable | A constrained board tool rail, contextual properties, focus lens, minimap, and optional presence |
| Linear-like speed | Keyboard, search, and consistent command language reduce friction | Command palette, quick add, stable shortcuts, compact mode, and immediate feedback |
| Slack-like conversation recovery | Unread, threads, mentions, and summaries help teams resume | Room topics, linked summaries, decisions, message conversion, and visibility previews |

Do not reproduce competitors’ layouts, icon arrangements, wording, motion sequences, or brand conventions. Every adopted pattern must serve provenance, case understanding, or user control.

## 3. Information hierarchy

Every feature belongs to one of five visibility levels.

### Level 0 — persistent orientation

Always visible at normal desktop widths:

- current workspace;
- current case or global location;
- global search/command entry;
- sync/connection state;
- AI context and private/shared visibility when AI is open;
- current account; and
- a safe path back to Home or Board.

These elements answer “Where am I, what is active, and is my work safe?”

### Level 1 — primary destinations

Visible in stable navigation because they represent distinct user intentions.

**Global:** Home, Cases, Find a Lawyer, Notifications, Help, New case.  
**Inside a case:** Home, Board, Room, Reports.

Case settings do not compete with daily work; they live in the case header/menu and remain directly discoverable.

### Level 2 — contextual work

Appears beside the object or activity that gives it meaning:

- selected-object properties and provenance;
- comments and object activity;
- AI assessment and proposals;
- board library drawer;
- report source/inclusion controls;
- Room thread details;
- lawyer booking summary.

Contextual work belongs in the right **Context Lens**, inline popover, or focused drawer—not a new global page.

### Level 3 — advanced and infrequent commands

Available through command palette, overflow menus, keyboard shortcuts, and advanced sections:

- saved views and layout options;
- bulk metadata actions;
- import/export variants;
- board alignment and distribution;
- technical source metadata;
- audit filters;
- advanced notification rules; and
- administrative tools.

A command cannot be Level 3 if it is the only way to complete the page’s main purpose.

### Level 4 — protected actions

Separated from frequent actions and never invoked accidentally:

- permanent deletion;
- retention changes;
- external sharing;
- lawyer consultation-package release;
- booking and payment;
- member removal or role downgrade;
- account/workspace deletion; and
- any future filing or legal submission.

Protected actions receive a dedicated review step that names affected objects, recipient, cost, retention, and reversibility.

## 4. Desktop spatial model

EvidenceSpace uses four stable regions and one conditional status strip.

### 4.1 Global Dock — 64 px

A dark, quiet vertical dock anchored to the left edge.

Top to bottom:

1. EvidenceSpace mark and workspace switcher.
2. Home.
3. Cases.
4. New case—visually available but not louder than the active destination.
5. Find a Lawyer.
6. Notifications.
7. Help.
8. Flexible spacer.
9. Account/avatar and connection indicator.

The Dock uses icons with tooltips at normal width. The active destination has a filled tonal background and a 2 px side marker. Badges show counts only when action is required.

### 4.2 North Bar — 44 px

A desktop-aware title and command bar spanning the remaining window.

Left to right:

- workspace/case breadcrumb;
- current object/frame when relevant;
- centered global search and command entry (`Ctrl/Cmd + K`);
- AI context chip when the Context Lens is open;
- sync/connection state;
- member presence or consultation status where relevant;
- notification shortcut; and
- native window controls.

The North Bar does not hold page-specific editing tools. Those belong with the page.

### 4.3 Case Spine — 224 px expanded, 56 px collapsed

The Case Spine appears only inside a case. It is the case’s table of contents, not a second global sidebar.

Contents:

- case title and compact classification/jurisdiction;
- Home, Board, Room, Reports;
- pinned board frames or saved report drafts, limited to a short contextual list;
- processing/access warning when action is required;
- case menu for members, jurisdiction, archive, export, and settings; and
- collapse control.

On the Board it defaults to collapsed after the user has learned the structure, preserving canvas width. Hover/focus reveals labels; keyboard users can expand it explicitly.

### 4.4 Work Surface — flexible, minimum useful width 760 px

The primary page content. It owns the page title, main action, local filters, and content-specific controls.

No fixed dashboard tile grid is applied to every page. Layout follows the work:

- reading and planning pages use a bounded content width;
- data libraries use flexible lists/tables;
- Board uses the full available surface;
- Room uses conversation geometry; and
- Reports use outline/editor/preview geometry.

### 4.5 Context Lens — 368 px expanded, 52 px collapsed

A shared right-side region for AI, Properties, Comments, and Activity. One tab is visible at a time.

Why one Lens:

- prevents several competing drawers;
- preserves the relationship between selection and context;
- gives AI a stable home without making it a separate destination; and
- allows the center surface to remain predictable.

Behavior:

- opening AI does not discard selected-object details;
- selecting an object may offer—not force—a switch to Properties;
- unread comments show a badge without opening automatically;
- a collapsed Lens retains tab icons, current AI scope, and activity indicators;
- at constrained width the Lens overlays rather than crushing the Work Surface; and
- Escape closes the overlay and restores focus.

### 4.6 Status Floor — 28 px, contextual

Shown primarily on Board, uploads, reports, and realtime views:

- zoom and viewport;
- object/selection count;
- save/sync state;
- current frame;
- background processing state; and
- keyboard help.

It is not a dumping ground for errors; actionable problems appear near the affected work and in Notifications.

## 5. Feature-placement matrix

| Function | Primary placement | Secondary path | Keep out of |
| --- | --- | --- | --- |
| Create case | Global Dock and Cases header | Command palette | Profile menu |
| Upload evidence | Board tool rail and empty-case action | Command palette / drag-drop | Generic global toolbar |
| Ask AI | Context Lens | Selection menu / command palette | Separate page that loses context |
| AI scope and visibility | Lens header beside thread | Expanded context inspector | Settings-only control |
| Invite member | Case header | Case settings | Hidden overflow only |
| Add task | Case Home and Board tool rail | Message/AI conversion | Global Dock |
| Web Research | Board tool rail and Case Home gap action | AI Research mode | Marketplace search |
| Find a Lawyer | Global Dock and contextual case header shortcut | AI recommendation with explanation | Fear-based blocking modal |
| Board history | Board toolbar | Activity tab | Case settings |
| Object provenance | Properties tab, one interaction from object | Evidence viewer | Hover-only tooltip |
| Comments | Context Lens | Object context menu | Separate global inbox |
| Reports | Case Spine | Case Home readiness action | Board tool rail |
| Case settings | Case header menu / Spine footer | Command palette | Main daily navigation item |
| Export | Reports and case menu | Command palette | Evidence card primary action |
| Delete/archive | Case settings protected zone | Case menu with review | Frequent toolbars |
| Booking/payment | Lawyer profile and booking flow | Bookings area | Generic AI approval |
| Help/support | Global Dock | Error recovery actions | Hidden legal footer only |

## 6. Core page compositions

### 6.1 Welcome and authentication

**Vibe:** calm entrance, not a marketing splash screen inside the app.

- Left: concise product promise, privacy boundary, and optional synthetic-case visual.
- Right: sign in/create account/recovery card.
- Footer: privacy, terms, accessibility, support, service status.
- No carousel, testimonials, autoplay video, or feature overload.

Primary action changes between Create account and Continue according to session state.

### 6.2 Adaptive onboarding

A focused, resumable flow with one question group per step.

- Step label and plain-language reason.
- Main question area.
- “Not sure” and Skip for nonessential fields.
- Small side preview showing how the choice adapts terminology—not a fake completed dashboard.
- Back, Save and exit, Continue.

The flow ends with three equal paths: Create case, Open synthetic demo, Accept invitation.

### 6.3 Global Home

The Home page answers “What deserves my attention across my work?”

Order:

1. **Continue** — last meaningful location and why it matters.
2. **Assigned and time-sensitive** — tasks, deadlines, approvals, mentions.
3. **Cases requiring attention** — processing/access/review problems, not case-strength scores.
4. **Recent cases** — compact list.
5. **Consultations and invitations**.
6. **Recent collaboration**.

Do not lead with generic analytics or plan upsells.

### 6.4 Cases library

- Header with New case.
- Search and reversible filter row.
- Accessible list as default; optional visual grid.
- Each row shows identity, classification/jurisdiction, disclosed organization dimensions, next task, last activity, members, and warnings.
- Archive/pending deletion are secondary views.

Bulk actions appear only after selection and remain limited to safe operations.

### 6.5 AI-guided case creation

Use a conversation-form hybrid:

- user narrative occupies the main center;
- AI asks one high-value question at a time;
- a live **Case outline** on the right separates Confirmed, Suggested, Unknown, and Private;
- source/evidence upload remains optional;
- user can switch to structured form or Start blank;
- final review shows exactly what will be created: case, issue-track suggestions, tasks, gaps, and board starter.

AI or network failure never blocks manual creation, and all text remains recoverable.

### 6.6 Case Home

The Case Home is not a tile dashboard. It is a prioritized briefing.

**Top band**

- case identity, jurisdiction, status, members, sync;
- Invite, Search, Find a Lawyer, case menu.

**Primary row**

- left 2/3: Situation Brief with last-updated/source state;
- right 1/3: Next Recommended Step with reason, sources, alternatives, and one action.

**Organization ribbon**

A horizontal set of disclosed dimensions: Evidence processed, Reviews pending, Questions, Tasks, Deadlines, Research freshness. No combined “case score.”

**Working sections**

1. Issue tracks and contrary material.
2. Evidence gaps and requested information.
3. Tasks and deadlines.
4. People/organizations.
5. Recent decisions and activity.

The page begins quiet and expands detail on request. The default scroll should expose the current situation, next step, and highest-risk gaps before historical activity.

### 6.7 Board

The Board receives maximum space.

**Local top toolbar**

- board/frame switcher;
- undo/redo;
- search;
- focus/presentation;
- history;
- invite/share;
- more.

**Tool rail clusters**

1. Navigation: Select, Hand.
2. Sources: Uploads, Evidence, Web Research.
3. Structure: Timeline, Tasks, Entities/Issues.
4. Compose: Text, Sticky, Shape/Image, Draw.
5. Relationships: Connect, Frame.

At normal height all tools are visible with separators. At short height, the least frequent compose tools move under More while remaining in the command palette.

**Library drawer**

Search, filter, sort, preview, multi-select, and Add to board. Dragging is optional, not required.

**Canvas**

- subtle grid that fades at low zoom;
- objects show semantic family through shape, icon, label, and provenance rail;
- selected object has one contextual mini-toolbar;
- connectors reveal labels at usable zoom and remain available in Outline;
- AI layout appears as translucent ghost objects/edges within a bounded proposal frame;
- focus lens dims unrelated objects without hiding them;
- timeline is an object, not a separate mode;
- minimap and frame breadcrumb preserve orientation.

**Board empty state**

Three choices only: Add evidence, Use a case-type starter, Begin blank. A synthetic example is opt-in and cannot mix with the real case.

### 6.8 Evidence/source viewer

A split viewer designed for long inspection:

- center: original/derivative preview with exact locator;
- left collapsible strip: pages, timestamps, or frames;
- right Context Lens: metadata/provenance, accepted/provisional links, comments, and activity;
- lower drawer: extracted text and processing stages when requested.

Technical hash/storage details are available but not default reading clutter. A source citation opens at the exact page/region/time and offers a clear return path.

### 6.9 Web Research

- Query and filters at top.
- Research process appears as real stages with Cancel.
- Results grouped by source authority rather than undifferentiated cards.
- Result row exposes publisher/court, jurisdiction, dates, source type, excerpt, and limitations.
- Save, Compare, Cite, Add to board, Dismiss.
- Research ledger is a persistent side view, not hidden browser history.

### 6.10 Room

Room adapts without becoming two products.

**Team geometry**

- topic list on left;
- conversation center;
- Context Lens for thread details, shared AI, decisions, or activity;
- member/presence summary in header.

**Solo geometry**

The same page becomes a useful Case Journal:

- General contains private-to-case notes owned by the solo member;
- Shared Case AI remains available as the official case thread;
- Decisions and tasks can be recorded;
- Invite is present but not a blocking empty-state demand;
- copy says “Keep a case journal or invite someone when you are ready,” not “You are working alone.”

When a member joins, visibility is previewed before any existing note becomes shared.

### 6.11 Reports

Three-region builder:

- left: report outline, versions, and inclusion status;
- center: editable structured draft/preview;
- right Lens: sources, omissions, redactions, AI state, and comments.

Generate draft is not the only primary action; Review sources remains equally available when integrity issues exist. Export is enabled only after a fresh permission/source check.

### 6.12 Find a Lawyer and booking

The marketplace is globally reachable but visually part of the same system.

- search and filters remain visible and reversible;
- result cards prioritize verification scope, licensed jurisdiction, service, availability, language, and price before promotional biography;
- sponsored status is explicit;
- saved profiles and bookings are secondary tabs;
- lawyer profile uses a reading layout with a sticky service/booking summary;
- booking progresses through service → limited intake → conflict screening → selective share → price/terms → payment → confirmation;
- the exact consultation package is a first-class preview, never a checkbox buried in payment.

### 6.13 Settings and support

Settings are grouped by scope: Profile, Workspace, Case, Privacy & AI, Notifications, Billing, Data & security, Support.

The current scope is always named. Destructive actions live at the end of the relevant scope with plain impact language.

## 7. Solo and team engagement model

“Engagement” means sustained usefulness and confidence, not addiction.

### Solo loop

1. Resume the last meaningful location.
2. See what changed through processing or research.
3. Receive one source-backed next step.
4. Make visible organization progress.
5. Record a note/decision or complete a task.
6. Leave with drafts saved and an obvious return point.

Solo-specific value:

- Private AI and case-scoped journal.
- Focus mode and quiet notifications.
- “Continue where you left off.”
- Evidence gaps translated into small actionable requests.
- AI as a skeptical collaborator, not synthetic companionship.
- No empty collaboration screens that punish solo use.

### Team loop

1. See a permission-aware “Since you were away” summary.
2. Open mentions, assignments, decisions, or changed evidence.
3. Coordinate in Room or directly on the relevant object.
4. Convert discussion into a task/decision with destination preview.
5. Review/approve AI and member proposals.
6. Complete a handoff with owner, deadline, and source links.

Team-specific value:

- Presence as coordination, never productivity surveillance.
- Clear authorship and edit history.
- Shared Case AI with source-message links.
- Roles and visibility beside actions.
- Decision log and handoff summaries.
- Notification grouping and quiet hours.

### Shared principles

- Organization progress replaces gamification.
- Recommended actions explain why they matter.
- Completion moments are subtle acknowledgements, not confetti.
- Re-entry is prioritized over feed consumption.
- The app never generates artificial urgency or social pressure.

## 8. Command and interaction language

### Universal commands

- `Ctrl/Cmd + K` — search and command palette.
- `Ctrl/Cmd + N` — new case only from global scope; context menu clarifies when inside a case.
- `Ctrl/Cmd + Z / Shift + Ctrl/Cmd + Z` — undo/redo where safe.
- `Ctrl/Cmd + /` — keyboard help.
- `Esc` — close top overlay, cancel current tool, or return focus predictably.

### Board commands

Final keys require usability testing, but the concept supports:

- `V` select, `H` hand, `E` evidence, `T` text, `S` sticky, `C` connector, `F` frame;
- arrow-key movement with modified larger steps;
- Enter to inspect/edit; Space to open quick preview;
- Tab/Shift+Tab through structured object order; and
- command palette equivalents for every shortcut.

Shortcuts never replace visible controls. Inputs and assistive technology modes suppress conflicting single-key commands.

## 9. Responsive desktop behavior

### Wide: ≥ 1440 px

Global Dock, expanded Case Spine, Work Surface, and expanded Lens may coexist outside Board. Board defaults to collapsed Spine.

### Standard: 1180–1439 px

Case Spine collapses on Board; Context Lens may overlay at 340–368 px. Page grids reduce columns before reducing text size.

### Compact: 960–1179 px

Case Spine becomes an overlay opened from the breadcrumb. Context Lens overlays. Primary actions remain in the page header. Dense tables retain horizontal containment without hiding row actions.

### Below 960 px

Supported only as a constrained desktop window, not a full mobile app. One overlay panel at a time; the Board prompts to expand the window for advanced spatial editing while Outline remains fully usable.

No breakpoint may hide sync, current case, primary action, access state, or destructive-action consequences.

## 10. Attention and notification hierarchy

1. **Ambient:** saved, online, presence—small and noninterrupting.
2. **Informational:** processing complete, report ready—toast plus durable notification.
3. **Action requested:** assignment, mention, approval—badge and inbox item.
4. **Risk:** source stale, permission changed, deadline uncertain—inline alert at affected object/page.
5. **Blocking:** access lost, payment conflict, destructive confirmation—focused dialog only when continuation is unsafe.

Toasts never contain the only copy of an error or decision. Lock-screen notifications are generic by default.

## 11. Design validation plan

Before production implementation, validate the design in this order:

1. Navigation/tree test: can users predict where a function lives?
2. First-case flow: can an individual create a case without understanding the full system?
3. Case Home comprehension: can users describe current state, uncertainty, and next step?
4. Board object-language test: can users distinguish evidence, research, AI findings, and notes without relying on color?
5. AI approval test: can users state what will change, where, and whether it is reversible?
6. Solo Room test: does the surface remain valuable without collaborators?
7. Team recovery test: can a returning member find decisions and assignments without reading everything?
8. Accessibility review: keyboard, screen reader, 200% zoom, high contrast, and reduced motion.
9. Stress layout: large titles, localization, 1,000-object board, long conversations, narrow windows.
10. Windows/macOS visual and input review.

A screen is not approved because it looks polished. Approval requires successful task flow, state comprehension, source visibility, recovery behavior, and accessibility.

## 12. First design package

The first reviewable package deliberately covers one end-to-end story rather than every final screen:

**Case Home → Board → AI proposal → approval preview → updated case state**, with Solo/Team and Context Lens variations.

It establishes:

- shell geometry;
- navigation hierarchy;
- feature placement;
- visual language;
- evidence/research/AI semantics;
- motion grammar;
- solo/team adaptation;
- empty/error/reconnect patterns; and
- components reusable by later pages.

Only after this foundation passes design review should production UI implementation or detailed secondary-page design accelerate.
