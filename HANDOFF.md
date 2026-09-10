# HANDOFF — EvidenceSpace

> Factual resume point for the next contributor. Keep observed evidence separate
> from product ambition.

## Resume here

EvidenceSpace has one connected, synthetic product slice:

**Home → Cases → Case C-03 Brief → Evidence E-04 → Context Lens → exact-object
return**.

The implementation lives under `web/evidencespace-*` and
`web/evidencespace-pages/`. It is publicly previewable, but it is not production
authentication, storage, collaboration, evidence processing, payments, or AI.

A trust-preserving, read-only C-03/E-04 adapter boundary is now implemented.
The next weakest product area is a **dedicated read-only CaseFind provider** that
reads existing stores without upgrading or mutating them. Do not add a
provider-backed write path yet.

## Current repository truth

- The canonical 37-screen prototype is preserved unchanged.
- Product pages exist for Home, Cases, Brief, and Evidence.
- Other destinations render honest foundations inside the same shell.
- The shell provides query-addressable routes, History API navigation,
  Back/Forward support, page-level lazy loading, intent prefetch, teardown,
  stale-render protection, page-labelled main landmarks, exact Context Lens
  focus return, titles, and live announcements.
- Evidence and Context Lens can read the same normalized C-03/E-04 result through
  `globalThis.__evidenceSpaceEvidenceProvider`.
- The adapter checks route, source, original-metadata, processing, and statement
  source identities before returning a deeply frozen display record.
- Provider denial, absence, deletion, staleness, change, malformed output, and
  failure return no source record. Synthetic fallback is used only when no
  provider exists.
- Provider-backed records are read-only. Session-only confirm/correct behavior
  remains available only in the visibly labelled synthetic preview.
- Loading, empty, denied, error, narrow-window, dark, reduced-motion, and
  forced-colors behavior exists for the connected slice.
- CaseFind remains runnable as the migration asset for proven persistence,
  integrity, review, timeline, export, deletion, and recovery behavior.

## Public demo

Live URL: <https://evidencespace.github.io/nonameyet/>

The first manual Pages deployment succeeded from `main` at
`8464ae81ab92e2bc594f8f630cb38b19da360245`. Repository metadata reports Pages
enabled, and a user-supplied desktop capture shows the Home page rendered with
its connected shell.

Publication is deliberately bounded:

- `scripts/build-public-demo.mjs` creates a fresh 16-file allowlist.
- Only the connected synthetic shell, its read adapter and page modules, a
  disclosure entry, a disallowing `robots.txt`, and `.nojekyll` are published.
- The canonical prototype, CaseFind files, documents, backend code, and
  repository history are not in the Pages artifact.
- The entry says the data is fictional, warns against entering real case
  information, and states that accounts, secure storage, payments, and AI
  actions are not connected.
- `noindex`, `nofollow`, and `noarchive` reduce accidental discovery; they are
  not access control. The site is public.
- External workflow actions are pinned to immutable commits. Checkout v7.0.1
  and setup-node v7.0.0 replaced Node 20-based action runtimes in PR #118.

The crawler used for independent text extraction respected `noindex` and
returned `CRAWL_NOINDEX`; the computer sandbox also lacked public DNS. Do not
claim that every live route, resource, or console state was independently
exercised from that environment. The 16-file artifact has not yet been observed
in a live deployment.

## Canonical design

Primary baseline:

- `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`
- `design-prototypes/prototype-routes.json`

Verified identity:

- normalized bytes: `5,226,405`;
- normalized SHA-256:
  `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`;
- repository blob: `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`;
- 37 unique named 1920×1080 WebP screens.

Individually reviewed screens: 1, 2, 3, 7, 8, 10, 11, and 12. Do not imply the
remaining 29 received route-by-route review.

## Connected architecture

Core files:

- `web/evidencespace-shell.html`
- `web/evidencespace-shell.js`
- `web/evidencespace-shell-model.js`
- `web/evidencespace-shell.css`
- `web/evidencespace-tokens.css`
- `web/evidencespace-pages/evidence-record-adapter.js`
- `web/evidencespace-pages/`

Primary routes:

- Home: `?route=home`
- Cases: `?route=cases`
- Brief: `?route=brief&case=C-03`
- Evidence: `?route=evidence&case=C-03&evidence=E-04&from=brief`
- Context Lens: `?route=brief&case=C-03&context=E-04`

“Webapps as pages” means one mounted shell with addressable pages, independent
lazy modules, exact-object context, and working return paths—not disconnected
HTML mini-apps. Query URLs remain intentional for static and packaged-host
compatibility.

## Observed verification

- The first connected slice passed 7 deterministic and 10 browser tests during
  its original local verification.
- Page-focus continuity added three focused browser regressions and passed all
  exact-head GitHub quality jobs before PR #116 merged.
- The public artifact has deterministic coverage for its exact 16-file list,
  disclosure/no-index boundary, forbidden paths/content, and relative JavaScript
  import resolution.
- The read-adapter implementation head
  `25212db2d93f9bbd219e97f4515ae8a2f2f27b4e` passed all four GitHub quality
  jobs in run `34480892200`: dependency/docs/assets/typecheck, deterministic,
  Chromium lifecycle, and aggregate.
- Focused adapter coverage includes 10 deterministic tests and three browser
  tests for matching provider data, provider denial, and stale Context Lens
  identity.
- Node 24 action upgrades passed dependency/docs/assets/typecheck,
  deterministic, Chromium lifecycle, and aggregate checks before PR #118 merged.
- The successful public deployment and rendered Home page were visually
  supplied by the user.

## Not proven

- production authentication, authorization, persistence, or collaboration;
- an actual CaseFind IndexedDB provider or legacy-to-new migration;
- original-byte rehashing through the connected shell;
- any provider-backed review, upload, deletion, or collaboration write;
- real AI execution, notifications, marketplace, booking, or payments;
- backend concurrency, revocation, retry, partial failure, or deletion;
- packaged Windows/macOS behavior;
- real assistive-technology combinations;
- full route/console/resource QA of the public URL;
- live deployment of the 16-file artifact;
- route-by-route QA of all 37 canonical screens.

## Immediate next task

1. Build a dedicated CaseFind read provider around the current stores without
   opening them at a newer version or writing during reads.
2. Map legacy file IDs to stable EvidenceSpace case/evidence IDs without copying
   source bytes into the page layer.
3. Return explicit `ready`, `denied`, `missing`, `deleted`, `stale`, `changed`,
   and `error` states through the existing adapter contract.
4. Test matching, denied, missing, deleted, stale, changed, open-failure, and
   recovery behavior against temporary IndexedDB fixtures.
5. Prove that opening and reading leaves the source database unchanged.
6. Keep provider-backed mutations blocked until source identity, explicit human
   review, concurrency, recovery, deletion, and rollback guarantees are proven
   through the new boundary.

## Stable product structure

Global: **Home → Cases → New case → Lawyers → Notifications → Settings →
Security and help → Account**.

Case lenses: **Brief → Space → Evidence → Research → Work → Room → Reports**.

Core loop: **capture → preserve → organize → understand → decide → act →
review**.

Trust boundaries:

- Workspace membership does not grant case access.
- Payment does not grant case access.
- AI proposes; an authorized person decides.

## Human-made interface requirements

- Use short, familiar vocabulary.
- Remove copy before shrinking type.
- Keep headings proportional and supporting text readable.
- Create appeal through hierarchy, spacing, alignment, content, and useful
  states—not filler cards or decoration.
- Use motion only when it explains cause, movement, progress, or status.
- Avoid ornamental AI imagery, arbitrary gradients, glass everywhere, and
  generic dashboard redesigns.
- Refine the approved system instead of replacing it.

## Delivery guardrails

- Durable accepted work belongs on `main` through focused reviewed changes.
- Keep the canonical prototype outside unrelated diffs.
- Keep CaseFind until trust-critical replacements and migration tests exist.
- Keep PR #86 on hold; salvage only targeted current behavior.
- Keep historical branch cleanup separate from product work.
- Treat the Pages site as a public synthetic preview, never production hosting.

## Required checks

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

When implementation truth changes, update this file,
`handoff/CURRENT-STATE-AND-NEXT-STEPS.md`, and
`handoff/SESSION-LEDGER.md`; report only observed results and state what remains
unverified.
