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
   - Uses synthetic fixtures and session-only preview controls.

2. **CaseFind migration asset** under older `web/` and `src/` paths.
   - Still owns proven persistence, integrity, review transition, timeline,
     report/export, deletion, and recovery behavior.
   - Must remain runnable until equivalent EvidenceSpace behavior and migration
     tests exist.

The connected slice is recognizable but incomplete. It does not provide
production auth, persistence, collaboration, ingestion, AI execution,
marketplace, payments, or legal services.

## Public preview

Live URL: <https://evidencespace.github.io/nonameyet/>

Observed facts:

- GitHub repository metadata reports `has_pages: true`.
- Public demo deployment #1 completed successfully from commit
  `8464ae81ab92e2bc594f8f630cb38b19da360245`.
- A user-provided desktop capture shows the published Home page rendered.
- The Pages artifact is a tested 15-file allowlist containing only the connected
  synthetic shell and its disclosure entry.
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
resource, and console QA is therefore not claimed.

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
- Evidence distinguishes the original email from annotations and exposes
  provenance, statements, review state, and backlinks.
- Context Lens exposes details, comments, activity, and an
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
- User evidence shows the first Pages deployment succeeded and Home rendered.

Do not extend these observations to production data, backend behavior, packaged
desktop, real assistive technology, or full live-site QA.

## Not verified

- production authentication/authorization or writes;
- original-source ingestion through the new shell;
- legacy-to-new data migration;
- real offline/reconnect, concurrency, revocation, retry, or deletion;
- packaged Windows/macOS behavior;
- real screen-reader/browser combinations;
- all 37 canonical screens;
- every live public route, asset, and console state.

## Next weakest area

**Trust-preserving CaseFind migration into one read-only connected data seam.**

Required sequence:

1. Refresh representative storage, integrity, review, timeline, deletion,
   recovery, export, and restricted-data code.
2. Write the current invariant map.
3. Define an adapter that does not expose legacy DOM/storage shapes to page
   modules.
4. Load one read-only C-03/E-04 source record with explicit synthetic fallback.
5. Add contract tests for provenance, denied access, stale/deleted/changed
   sources, contrary evidence, recovery, and rollback.
6. Add no mutation until those tests pass.
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
