# Current state and next steps

**Last reconciled:** 9 September 2026  
**Last code-bearing `main` baseline:** `fd22c47e3d6f6353636604ad108be3bca963819a` after PR #112

## Current

- The approved 37-screen EvidenceSpace prototype is preserved and reverified. The user reaffirmed it as the visual/workflow baseline.
- Repository readiness and the durable four-job quality gate are complete.
- PR #102 merged the accessible route-state shell foundation.
- PR #103 merged the protocol-v1 desktop boundary and evidence gate.
- PR #104 merged the non-destructive cleanup audit; historical refs remain and `main` protection is still unconfigured.
- PRs #105–#108 merged the thin Electron candidate, deterministic fixture/reference profile, and Board measurement harness.
- PR #109 merged external deep-link plumbing and privacy-safe observation capture.
- PRs #110–#112 fixed Windows staging, package author metadata, and the V8 snapshot fuse.
- PR #112 exact-head run `34261834685` passed dependency/docs/assets/typecheck, deterministic tests, Chromium lifecycle, and aggregate quality.
- On the sanitized Windows reference device, staging, unsigned x64 packaging, fuse verification, and normal startup succeeded.
- CaseFind remains a runnable browser/local-first implementation with substantial provenance, processing, review, recovery, report, and test foundations.
- The product-shell branch `feat/product-shell-foundation-20260909` exists at the PR #112 baseline and contains no product commit or pull request.

## Design status

Accepted:

- the 37-screen connected HTML prototype;
- its light blue/lilac atmosphere, floating frame, rail/top-bar geometry, compact hierarchy, semantic accents, connected object flow, and page-specific composition;
- simple human language, less copy, restrained heading scale, purposeful space, and limited causal motion; and
- Brief → Space → Evidence → Research → Work → Room → Reports.

Rejected:

- the generic diagnostic shell as product design;
- a later standalone six-route redesign that changed the visual identity and added excessive copy; and
- generic dashboard cards, new arbitrary palette/background systems, AI-generated decoration, and animation everywhere.

The rejected standalone design was never committed or pushed.

## Prototype verification

- 37 unique WebP screenshots at 1920×1080.
- Repository LF size: `5,226,405` bytes.
- Canonical SHA-256: `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`.
- The user’s CRLF attachment normalizes exactly to the repository source.
- Exact routes and source filenames: `handoff/APPROVED-SCREEN-CATALOG.md`.

## Partial

- The shell has route/accessibility mechanics but not accepted product visual fidelity.
- Electron has source, packaging, and one normal Windows startup observation, but not complete host evidence.
- Deep-link parsing and registration exist, but a real URL did not visibly restore Evidence E-04; do not claim it passed.
- The deterministic Board assessor exists, but the browser diagnostic p95 was above the target and no accepted packaged result exists.
- Product/design specs are broad and approved; implementation has not reached the target routes.

## Not implemented or not verified

No production identity/session/recovery, cloud workspace, realtime collaboration, target case domain, persistent copilot, legal research service, production reports, marketplace, booking/payment, signed release, Tauri adapter, or complete CaseFind migration exists.

Not verified: cold/existing-instance deep links, native picker, packaged Board threshold, startup timing, memory, interruption recovery, OS accessibility tree, signing/updater/rollback, representative macOS, or production-host selection.

## Open work

- PR #86 is open/on hold and stale. Mine only narrow current value.
- Historical branches have not been deleted.
- `main` protection is unconfigured.
- Cross-platform memory semantics still require definition.

## Active slice

Implement a recognizable, prototype-faithful route set:

1. Global Home — screenshot 7.
2. Cases Library — screenshot 8.
3. Case Brief — screenshot 10.
4. Evidence E-04 — screenshot 12.
5. Context Lens and canonical object continuity across those routes.

For each surface:

- preserve the approved shell and composition;
- reduce unnecessary text and heading size;
- use familiar vocabulary;
- make blank space useful through state/content, not filler;
- implement real route state and synthetic data selectors;
- include loading, empty, denied, stale, error, reconnect, and recovery as relevant;
- cover keyboard, focus, forced colors, reduced motion, narrow width, and System/Light/Dark; and
- inspect side by side with the approved screenshot before publication.

## Next sequence

1. Merge the faithful slice only after applicable local checks, staging, visual inspection, committed-diff review, exact-head CI, and handoff update.
2. Resume Windows/macOS Electron observations and build the Tauri comparator.
3. Decide or explicitly defer host, renderer, and canvas/operation choices through measured ADRs.
4. Build identity/recovery, onboarding, workspace switching, and draft recovery.
5. Continue through Cases/Story Field/Brief, Evidence, Space, AI/Research, Work/Room/Notifications, Reports, and marketplace.
6. Complete signing/updater, release, audits, operations, migration, and staged launch.

## Verification expectation

Every pull request records exact commands, versions, platforms, states, counts, results, unverified areas, migration/rollback, remote SHA, and CI. A screenshot, source file, fixture, browser preview, or passing unit test is not evidence of unobserved production behavior. Keep canonical docs and living handoff current in the same pull request.