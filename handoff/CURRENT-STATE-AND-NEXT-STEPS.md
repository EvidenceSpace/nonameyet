# Current State and Next Steps

**Snapshot:** 2026-09-10  
**Scope:** EvidenceSpace repository takeover, canonical prototype preservation,
first connected product slice, and accessible page-focus continuity

## Current truth

EvidenceSpace now has two runnable surfaces with different roles:

1. **Connected EvidenceSpace slice** under `web/evidencespace-*` and
   `web/evidencespace-pages/`.
   - Implements Home, Cases, C-03 Brief, E-04 Evidence, and the shared Context
     Lens.
   - Uses one persistent shell with addressable query routes, History API
     navigation, Back/Forward support, native module lazy loading, exact-object
     context, page-labelled main landmarks, focus movement with exact Context
     Lens origin return, titles, and live announcements.
   - Includes loading, empty, denied, error, compact, dark, reduced-motion, and
     forced-colors behavior.
   - Uses synthetic fixtures and session-only preview controls.

2. **CaseFind migration asset** under the older `web/` and `src/` paths.
   - Still owns proven local persistence, integrity, review-transition,
     timeline, report/export, deletion, and recovery behavior.
   - Must remain runnable until equivalent EvidenceSpace behavior is implemented
     and migrated with tests.

The connected slice is the first recognizable application experience. It is not
the complete product and does not provide production auth, persistence,
collaboration, evidence ingestion, AI execution, marketplace, payment, or legal
services.

## Canonical design state

Preserved unchanged:

- `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`
- `design-prototypes/prototype-routes.json`

Identity:

- repository blob `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`;
- normalized SHA-256
  `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`;
- 37 named unique 1920×1080 WebP screens.

Individually reviewed: screens 1, 2, 3, 7, 8, 10, 11, and 12. The first
connected slice is visually anchored to screens 7, 8, 10, 11, and 12. The other
29 screens have not received route-by-route review.

## Implemented connected flow

- Home resumes case `C-03` and routes directly to its Brief or Evidence `E-04`.
- Cases provides four truthful synthetic records, search, filters, pinned work,
  focus, and next actions.
- Brief presents reviewed understanding with confirmed, contrary, and unknown
  material; the case path is descriptive rather than predictive.
- Evidence keeps the original email visually distinct, exposes provenance and
  review state, selects E-04, and returns to the exact Brief.
- Context Lens exposes details, comments, activity, and an
  `AI proposal · Not applied` without silent mutation. Its close control, Escape,
  scrim, and browser-history dismissal return keyboard focus to the exact
  opening object or control when that origin still exists.
- Unsupported destinations remain honest foundations inside the same shell.

## Architecture decisions

- Query-addressable routes are intentional for static and packaged-host
  compatibility.
- Native ES modules are an incremental no-framework choice for this slice, not a
  final renderer commitment.
- Route parsing bounds case/evidence/context identifiers before display or
  linking.
- Denied case views fail closed and do not expose the case title.
- The shell owns route loading, History API changes, cleanup, page-landmark
  labelling, title/focus updates, live announcements, and Context Lens
  continuity.
- Context focus restoration identifies the opening route, link, and accessible
  label. If the origin is unavailable after render, focus falls back to the page
  heading instead of disappearing.
- The page modules own product content and local interaction setup.

## Observed verification

Baseline local evidence for the first connected slice:

- JavaScript syntax checks passed.
- Deterministic suite: 7/7 passed.
- Playwright suite: 10/10 passed.
- Direct loading, persistent-shell navigation, C-03/E-04 continuity, return
  paths, Back/Forward, filters, search, Context Lens tabs, Escape, invalid
  routes, denied-title protection, recovery states, compact overflow, dark mode,
  and reduced motion were exercised.
- Desktop visual review covered Home, Cases, Brief, Evidence, and Context Lens
  at 1440px.
- Narrow visual review covered the same flow between 900px and 520px.
- Dark Home/Evidence, focus diagnostics, and Evidence error recovery were
  inspected.
- No page-level horizontal overflow, console errors, or failed product resources
  remained in the final browser pass.

Additional evidence for connected-page focus continuity:

- Local `node --check` passed for the changed JavaScript and TypeScript test
  source.
- Three focused Playwright regressions cover the page-labelled main landmark,
  exact Brief object focus return, and exact Evidence control focus return when
  duplicate Context Lens links exist.
- Exact-head GitHub Actions passed dependency/docs/assets/typecheck,
  deterministic tests, Chromium browser lifecycle, and the aggregate quality
  check for behavior commit `723bcf6d8c6bf9403ba5ce582ba972dccec12ce2`.
- The remote commit and changed-file diff were inspected.

Keep final-head GitHub Actions results in the pull request. Do not extend these
observations to packaged desktop, production data, real concurrency, or
assistive-technology combinations.

## Not verified

- production authentication or authorization;
- persistent or collaborative writes;
- original-source ingestion through the new shell;
- legacy-to-new data migration;
- offline storage and reconnect with real case records;
- revocation, concurrent edits, retry/idempotency, partial failure, or deletion
  against a backend;
- packaged Windows/macOS behavior;
- real screen-reader/browser combinations;
- full QA of all 37 canonical screens;
- public deployment or GitHub Pages visibility.

## Next weakest area

**Trust-preserving CaseFind migration into one read-only connected data seam.**

### Required sequence

1. Refresh representative CaseFind modules:
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
   - relevant `src/ai/`, `src/domain/`, `src/processing/`, and `src/report/`
     modules.
2. Write a current-invariant map covering original bytes, provenance, processing
   failure, explicit review transitions, contrary material, deletion, stale
   sources, reconnect, recovery, exports, and restricted-data handling.
3. Define an adapter boundary between connected page modules and legacy
   data/storage shapes.
4. Connect one read-only C-03/E-04 source-record seam before adding a mutation
   path.
5. Add contract tests for provenance, denied access, stale/deleted sources,
   contrary evidence, recovery, and rollback.
6. Keep synthetic fallback behavior explicit until the seam is proven.
7. Re-run repository checks and inspect the exact remote head before merge.

## Later visual slices

Still foundations:

- Space (apart from the shared Context Lens pattern)
- Research
- Work
- Room
- Reports
- New case
- Lawyers
- Notifications
- Settings
- Security and help
- Account

Review the matching canonical screens before implementing each slice. Do not
fill routes with generic cards merely to make them look complete.

## Stable product structure

Global:

Global route order: **Home → Cases → New case → Lawyers → Notifications →
Settings → Security and help → Account**.

Case lenses:

Case-lens order: **Brief → Space → Evidence → Research → Work → Room →
Reports**.

Core loop:

Core loop: **capture → preserve → organize → understand → decide → act →
review**.

One connected app means stable shared chrome, addressable pages, exact-object
context, backlinks, and smooth return paths—not separate mini-apps.

## Human-made interface guardrails

- Use short, familiar vocabulary.
- Remove copy before shrinking type.
- Keep headings proportional and helper text readable.
- Make space useful with hierarchy, content, state, or interaction.
- Use motion only to explain cause or state; support reduced motion.
- Avoid ornamental AI imagery, arbitrary gradients, glass everywhere, filler
  cards, and decorative animation.
- Refine the canonical system instead of replacing it with a generic dashboard.

## Delivery guardrails

- Keep durable accepted work on `main` through focused review.
- Keep the canonical prototype unchanged and outside unrelated diffs.
- Keep CaseFind until trust-critical replacements are proven.
- Keep PR #86 on hold; salvage only targeted, current behavior.
- Do not combine branch cleanup with feature work.
- Do not publish publicly without explicit visibility confirmation.

## Quality commands

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

Report observed results only. `tsconfig.json` covers `src/**/*.ts`, not the
browser shell, tests, scripts, or server.
