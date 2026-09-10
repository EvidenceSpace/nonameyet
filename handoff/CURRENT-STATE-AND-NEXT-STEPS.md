# Current State and Next Steps

**Snapshot:** 2026-09-10  
**Scope:** connected EvidenceSpace slice, public synthetic preview, and next
trust-preserving migration step

## Current truth

EvidenceSpace has two runnable surfaces with different roles:

1. **Connected EvidenceSpace slice** under `web/evidencespace-*` and
   `web/evidencespace-pages/`.
   - Implements Home, Cases, C-03 Brief, E-04 Evidence, and Context Lens.
   - Uses one persistent shell with addressable query pages, History API
     navigation, lazy modules, intent prefetch, page-labelled main landmarks,
     exact origin-focus return, and honest unfinished-page foundations.
   - Uses synthetic fixtures when no provider exists.
   - Accepts one read-only provider result through a validation adapter shared by
     Evidence and Context Lens.
   - Keeps provider-backed records read-only and fails closed without a record
     for denied, missing, deleted, stale, changed, malformed, or failed reads.

2. **CaseFind migration asset** under older `web/` and `src/` paths.
   - Still owns proven persistence, integrity, review transition, timeline,
     report/export, deletion, and recovery behavior.
   - Must remain runnable until equivalent EvidenceSpace behavior and migration
     tests exist.

The connected slice is recognizable but incomplete. It does not provide a real
CaseFind provider, production auth, persistence, collaboration, ingestion, AI
execution, marketplace, payments, or legal services.

## Public preview

Live URL: <https://evidencespace.github.io/nonameyet/>

Observed facts:

- GitHub repository metadata reports `has_pages: true`.
- Public demo deployment #1 completed successfully from commit
  `8464ae81ab92e2bc594f8f630cb38b19da360245`.
- A user-provided desktop capture shows the published Home page rendered.
- The Pages artifact is a tested 16-file allowlist containing only the connected
  synthetic shell, its read adapter, and its disclosure entry.
- The canonical prototype, CaseFind surface, repository documents, and backend
  code are excluded from the artifact.
- The public entry warns that data is fictional and that accounts, secure
  storage, payments, and AI actions are not connected.
- No-index metadata and `robots.txt` discourage indexing but do not make the site
  private.
- PR #118 moved checkout/setup-node to pinned Node 24-based releases after the
  first successful run exposed a Node 20 deprecation warning.

Independent automated page extraction was blocked by the intentional no-index
boundary, and the computer sandbox lacked external DNS. Full public route,
resource, and console QA is therefore not claimed. The 16-file artifact has not
yet been observed in a live deployment.

## Canonical design state

Preserved unchanged:

- `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`
- `design-prototypes/prototype-routes.json`

Identity:

- repository blob `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`;
- normalized SHA-256
  `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`;
- 37 named unique 1920×1080 WebP screens.

Screens 1, 2, 3, 7, 8, 10, 11, and 12 received individual review. The other 29
did not.

## Implemented flow

- Home resumes C-03 and links to Brief and E-04.
- Cases provides four truthful synthetic records with search and filters.
- Brief keeps confirmed, contrary, and unknown material visible.
- Evidence reads selected metadata, preview, source-linked statements, and
  provenance from an immutable normalized record.
- Context Lens receives the same normalized record and keeps source details
  closed for non-ready provider states.
- A matching provider record is visibly read-only; synthetic confirm/correct
  controls remain session-only and visibly labelled as preview behavior.
- Context Lens still exposes details, comments, activity, and an
  `AI proposal · Not applied`; dismissal returns focus to its exact opening
  object when available.
- Unsupported destinations remain honest foundations.

## Observed verification

- Original slice: JavaScript syntax passed; 7/7 deterministic and 10/10 browser
  tests passed locally.
- PR #116: all exact-head dependency/docs/assets/typecheck, deterministic,
  Chromium lifecycle, and aggregate jobs passed for page-focus continuity.
- PR #117: the same four gates passed for the public allowlist and its three
  deterministic artifact tests.
- PR #118: the same four gates passed for Node 24 workflow action upgrades.
- Read-adapter implementation commit
  `25212db2d93f9bbd219e97f4515ae8a2f2f27b4e` passed all four exact-head jobs in
  run `34480892200`.
- Adapter coverage includes 10 deterministic tests for identity, contrary
  material, provider states, recovery, rollback, and no-fallback behavior.
- Three browser tests exercise matching read-only provider data, denial without
  fixture leakage, and stale Context Lens identity.
- Public artifact tests require exactly 16 files and resolve every relative
  import.
- User evidence shows the first Pages deployment succeeded and Home rendered.

Do not extend these observations to production data, backend behavior, packaged
desktop, real assistive technology, or full live-site QA.

## Not verified

- a production CaseFind read provider or authorization service;
- original-source ingestion or rehashing through the new shell;
- legacy-to-new data migration;
- provider-backed review, correction, upload, deletion, or collaboration writes;
- real offline/reconnect, concurrency, revocation, retry, or deletion;
- packaged Windows/macOS behavior;
- real screen-reader/browser combinations;
- all 37 canonical screens;
- every live public route, asset, and console state;
- a live deployment containing the 16-file artifact.

## Next weakest area

**Dedicated read-only CaseFind provider behind the verified adapter.**

Required sequence:

1. Open the existing CaseFind database at its current version without upgrading
   or mutating it.
2. Read the case, file, processing, fact, and suggestion stores required for one
   source snapshot.
3. Map legacy file IDs to stable EvidenceSpace case/evidence IDs.
4. Return explicit authorization-aware non-ready states through the existing
   contract.
5. Test identity drift, denied/missing/deleted states, open failure, recovery,
   and no-write behavior against temporary IndexedDB fixtures.
6. Add no provider-backed mutation until compare-and-swap, atomicity, source
   dependency, recovery, and rollback guarantees are proven at this boundary.
7. Re-run exact-head repository checks before merge.

## Later visual slices

Still foundations: Space apart from Context Lens, Research, Work, Room, Reports,
New case, Lawyers, Notifications, Settings, Security and help, and Account.
Review each matching canonical screen before implementation. Do not add generic
cards merely to imply completion.

## Stable structure

Global: **Home → Cases → New case → Lawyers → Notifications → Settings →
Security and help → Account**.

Case lenses: **Brief → Space → Evidence → Research → Work → Room → Reports**.

Core loop: **capture → preserve → organize → understand → decide → act →
review**.

One connected app means stable chrome, addressable pages, exact-object context,
backlinks, and smooth return paths—not separate mini-apps.

## Delivery guardrails

- Keep accepted work on `main` through focused review.
- Keep the canonical prototype outside unrelated diffs.
- Preserve CaseFind until trust-critical replacements are proven.
- Keep PR #86 and branch cleanup separate.
- Treat GitHub Pages as a public synthetic preview, not production hosting.
- Use short familiar copy, proportional typography, restrained causal motion,
  and no ornamental AI imagery.

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
