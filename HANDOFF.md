# HANDOFF — EvidenceSpace

> Living handoff for the next contributor. Keep this file factual, concise, and
> aligned with the repository.

## Resume here

EvidenceSpace now has its first recognizable connected product slice:

The connected route is **Home → Cases → Case C-03 Brief → Evidence E-04 →
Context Lens → exact-object return**.

The implementation lives under `web/evidencespace-*` and
`web/evidencespace-pages/`. It is a prototype-faithful, synthetic front end—not
production authentication, storage, collaboration, evidence processing, or AI.

The next weakest area is no longer shell architecture. It is **trust-preserving
migration**: refresh representative CaseFind integrity and recovery modules,
write the invariant map, and connect one real data seam without weakening
original-source protection or honest state handling.

## Status snapshot

### Current in the repository

- The canonical 37-screen EvidenceSpace prototype is preserved unchanged.
- Human-made interface quality requirements are durable in repository guidance.
- The connected shell has a stable rail, quiet top bar, global routes, seven
  case lenses, query-addressable URLs, History API navigation, Back/Forward
  support, page-level lazy loading, route teardown, stale-render protection,
  titles, focus movement, and live announcements.
- Product pages exist for Home, Cases, Brief, and Evidence.
- The shared Context Lens works from Brief and Evidence.
- Case `C-03` and Evidence `E-04` remain the same objects across navigation and
  return paths.
- Honest foundations remain for unfinished pages; they do not pretend to be
  product-complete.
- Loading, empty, denied, error, narrow-window, dark, reduced-motion, and
  forced-colors behavior is present.
- Deterministic and Playwright coverage exercises the connected slice.
- CaseFind remains runnable as a migration asset.

### Not current / not proven

- No production auth, authorization store, persistence, collaboration, upload,
  evidence ingestion, AI execution, notifications, marketplace, payment, or
  legal workflow is connected to the new slice.
- Preview confirm/correct controls are session-only and do not save or share
  data.
- Unsupported routes are foundations, not finished pages.
- Only eight of 37 canonical screens have received individual route-level
  inspection.
- The Electron/desktop host has not been proven against this connected shell.
- Windows packaging, assistive-technology combinations, real network loss,
  concurrent edits, revocation, and production-scale performance remain
  unverified.
- CaseFind trust behavior has not yet been migrated into the new presentation
  layer.

## Canonical design and preservation

Primary baseline:

- `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`
- `design-prototypes/prototype-routes.json`

Verified identity:

- raw attachment bytes: `5,226,610`;
- raw SHA-256:
  `114d1e96debe2b6dda13a76782c55085ab6f479543a56a2c6f5071a921134c72`;
- normalized bytes: `5,226,405`;
- normalized SHA-256:
  `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`;
- repository blob: `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`;
- 37 unique named 1920×1080 WebP screens.

Individually reviewed source screens:

- `01-auth.webp`
- `02-onboarding-profile.webp`
- `03-onboarding-legal.webp`
- `07-home.webp`
- `08-cases.webp`
- `10-brief.webp`
- `11-space.webp`
- `12-evidence.webp`

The first connected slice uses screens 7, 8, 10, 11, and 12 as visual anchors.
Do not imply the remaining 29 screens have received route-by-route QA.

## Connected slice architecture

### Core files

- `web/evidencespace-shell.html`
- `web/evidencespace-shell.js`
- `web/evidencespace-shell-model.js`
- `web/evidencespace-shell.css`
- `web/evidencespace-tokens.css`
- `web/evidencespace-pages/fixtures.js`
- `web/evidencespace-pages/page-utils.js`
- `web/evidencespace-pages/foundation.js`
- `web/evidencespace-pages/home.js`
- `web/evidencespace-pages/cases.js`
- `web/evidencespace-pages/brief.js`
- `web/evidencespace-pages/evidence.js`

Tests:

- `tests/evidencespace-shell.test.ts`
- `tests/browser/evidencespace-shell.spec.ts`
- `tests/browser/evidencespace-map-layout.spec.ts`

### Routes

- Home: `?route=home`
- Cases: `?route=cases`
- Brief: `?route=brief&case=C-03`
- Evidence: `?route=evidence&case=C-03&evidence=E-04&from=brief`
- Context Lens: `?route=brief&case=C-03&context=E-04`
- State diagnostics: `view=loading`, `view=empty`, `view=denied`, `view=error`

Query-addressable routes are intentional for static and packaged-host
compatibility. Native ES modules are an incremental no-framework decision for
this slice, not a permanent renderer commitment.

### Implemented product behavior

Home:

- resumes C-03;
- shows a concise current focus and connected-object preview;
- routes primary actions to Brief and E-04;
- shows truthful synthetic case, attention, Private AI, and quick-start regions.

Cases:

- contains four synthetic records;
- supports search and functional All / Needs you / Mine / Shared filters;
- presents pinned cases and an accessible table;
- keeps current focus and next action visible.

Brief:

- presents qualified reviewed understanding;
- keeps source support, contrary material, and unknowns visible;
- labels the path as descriptive, not predictive;
- provides one source-linked next step;
- exposes the connected case map and Context Lens.

Evidence:

- keeps the original source visually distinct from annotations;
- shows provenance, integrity language, statements A1/A2, review status, and
  backlinks;
- keeps E-04 selected and returns to the same Brief;
- labels confirmation/correction as a browser-session preview rather than fake
  persistence.

Context Lens:

- shows the selected E-04 source-backed assessment;
- has keyboard-operable Details, Comments, and Activity tabs;
- labels the Ghost Proposal `AI proposal · Not applied`;
- routes to Work for later review instead of silently mutating state;
- closes through its control, scrim, or Escape while preserving route
  continuity.

## Verification evidence

Observed locally for the final production files:

- `node --check` passed for all new JavaScript modules.
- Deterministic suite: 7 tests, 7 passed, 0 failed.
- Browser suite: 10 tests, 10 passed, 0 failed.
- The functional flow covered direct load, Home → Cases → Brief → E-04, exact
  return, Back/Forward, filters, search, Context Lens, Escape, denied-title
  protection, invalid routes, compact overflow, and recovery states.
- Desktop visual inspection covered Home, Cases, Brief, Evidence, and Context
  Lens at 1440px.
- Narrow visual inspection covered Home, Cases, Brief, Evidence, and Context
  Lens between 900px and 520px.
- Dark Home/Evidence, focus diagnostics, and Evidence recovery states were
  inspected.
- No page-level horizontal overflow, console errors, or failed product resources
  remained in the final browser run.

Keep exact-head GitHub Actions evidence in the pull request. Do not convert
local evidence into a claim that packaged desktop, production data, or
assistive-technology combinations were tested.

## CaseFind migration asset

The earlier CaseFind interface is not the target visual system, but it contains
behavior that must not be discarded without proof.

Refresh these representative paths before making migration claims:

- `web/storage.js`
- `web/index.html`
- `web/cases.html`
- `web/cases-new.html`
- `web/case.html`
- `web/review-transition.js`
- `web/timeline-model.js`
- `web/timeline-ui.js`
- `web/original-byte-integrity.js`
- `web/processing-integrity.js`
- relevant modules under `src/ai/`, `src/domain/`, `src/processing/`, and
  `src/report/`

Record at least these invariants:

1. originals remain byte-preserved and distinguishable from derivatives;
2. processing failures do not silently replace or downgrade source truth;
3. review transitions are explicit, reversible where promised, and auditable;
4. deletion, stale-source, reconnect, and recovery behavior is fail-closed;
5. exported/report material preserves provenance and uncertainty;
6. private or restricted matter data never leaks into fixtures, logs,
   screenshots, traces, or CI artifacts.

Do not claim the new synthetic slice replaces any of those behaviors until an
equivalent implementation and migration test exist.

## Immediate next task

1. Read the representative CaseFind paths above and write a compact
   current-invariant map.
2. Choose one vertical data seam for C-03/E-04—prefer read-only loading of an
   original-source record before any mutation path.
3. Define adapter boundaries so the connected UI does not depend directly on
   legacy DOM or storage shapes.
4. Add contract tests for provenance, contrary material, denied access,
   stale/deleted source behavior, and recovery.
5. Implement the seam behind the existing synthetic interface without changing
   the canonical prototype.
6. Re-run deterministic, browser, security, docs, dependency, workflow, type,
   and full repository checks.
7. Inspect the exact remote diff and GitHub Actions head before merge.

After that, select the next visual route from the remaining canonical screens.
Space is still a foundation; only the shared Context Lens pattern is
implemented.

## Product structure that must remain stable

Global:

Global route order: **Home → Cases → New case → Lawyers → Notifications →
Settings → Security and help → Account**.

Inside a case:

Case-lens order: **Brief → Space → Evidence → Research → Work → Room →
Reports**.

Core loop:

Core loop: **capture → preserve → organize → understand → decide → act →
review**.

Signature patterns:

- Case Spine
- Provenance Rail
- Context Lens
- Ghost Proposal
- Workspace receipt

“Webapps as pages” means one connected app with addressable routes, a shared
shell, exact-object context, and working return paths—not disconnected
mini-apps.

### Trust boundaries

- Workspace membership does not grant case access.
- Payment does not grant case access.
- AI proposes; an authorized person decides.

## Human-made interface requirements

- Keep the result recognizably human-designed rather than generated.
- Use vocabulary a person understands on first reading.
- Remove or shorten copy before shrinking typography.
- Avoid billboard headings and tiny helper text.
- Use proportion, spacing, alignment, typography, meaningful content, and
  designed states to create appeal.
- Prefer one clear primary action and a small number of honest supporting
  actions.
- Avoid ornamental AI imagery, arbitrary gradients, glass everywhere, filler
  cards, and motion for its own sake.
- Keep motion limited, causal, performant, and compatible with reduced motion.
- Test empty, loading, denied, error, offline/retry, stale, reconnect, deletion,
  and recovery states appropriate to each slice.

**Refine, do not redesign.** Improve the approved prototype without turning
EvidenceSpace into a generic dashboard.

## Delivery and branch posture

- Durable accepted work belongs on `main` through focused reviewed changes.
- The canonical prototype must remain outside unrelated diffs.
- Do not mix historical branch cleanup, PR #86 salvage, or public deployment
  into product-slice changes.
- PR #86 remains on hold until targeted salvage is proven.
- Defer deleting historical branches until protection and automatic
  merged-branch deletion are in place.
- Do not publish GitHub Pages or another public deployment without explicit
  visibility approval.

## Required checks

Run applicable checks and report observed outcomes:

```bash
npm run check:dependencies
npm run check:workflow-actions
npm run sync:pdfjs
npm run check:docs
npm run typecheck
npm test
npm run test:browser
npm run check
```

`tsconfig.json` covers `src/**/*.ts`; do not claim it typechecks the browser
shell, tests, scripts, or server.

## Continuity protocol

When implementation truth changes:

1. update this file;
2. update `handoff/CURRENT-STATE-AND-NEXT-STEPS.md`;
3. append `handoff/SESSION-LEDGER.md`;
4. keep exact command results and remote CI evidence in the pull request;
5. state what was not verified;
6. name the next weakest area without inflating progress.
