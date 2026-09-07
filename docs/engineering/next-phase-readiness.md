# Next-phase engineering readiness

**Status:** repository readiness, framework-neutral shell, desktop boundary, and thin Electron adapter source complete; packaged desktop and cloud architecture remain Decision required.

## Gate 1 — trustworthy CI: complete

Repository readiness was repaired in PR #99 without merging the stale broad PR #87. The durable workflow separates dependency/workflow/document checks and typecheck, deterministic tests, strict Chromium lifecycle, and an aggregate gate.

PR #99 exact-head run `33973538762`, PR #101 run `33973822119`, PR #102 run `34016180978`, PR #103 run `34017257691`, and PR #104 run `34110882507` each independently passed all four jobs. TypeScript is `5.8.3`; only `.github/workflows/quality.yml` belongs on `main`; temporary diagnostics must be removed before merge. Every changed exact head must pass again.

## Current implementation slice — accessible shell foundation

The repository includes an isolated browser-rendered EvidenceSpace shell at `web/evidencespace-shell.html`. It does not replace the CaseFind entry point and does not choose a desktop host or renderer framework.

Implemented:

- semantic tokens with System/Light/Dark behavior;
- approved 22px/68px/108px large-window shell geometry;
- eight global destinations;
- Brief → Space → Evidence → Research → Work → Room → Reports;
- context-aware global parent and case-lens active states;
- stable case-ID continuity and allowlisted route recovery;
- one main landmark and H1, skip navigation, visible focus, practical targets, forced-colors support, reduced motion, and narrow bottom-navigation reflow; and
- deterministic model and focused Chromium tests.

Not implemented by the shell: persisted settings, identity, cloud workspaces, case domain data, collaboration, research providers, production AI, report generation, marketplace behavior, desktop release packaging, or signed releases.

## Gate 2 — boundary and thin Electron adapter implemented; runtime evidence pending

ADR 0003 establishes the contract and measurement order without selecting a production host.

Candidate-neutral work implemented:

- protocol-v1 allowlisted native request envelopes;
- capabilities discovery and native evidence-picker commands only;
- exact data-key validation and rejection of raw renderer paths;
- bounded privacy-safe EvidenceSpace deep links with case/object continuity;
- a deny-by-default desktop security baseline;
- a four-cell Electron/Tauri × Windows/macOS evidence matrix;
- exact commit and packaged-artifact binding; and
- mandatory crash, deep-link, picker, accessibility-tree, signed-updater, and 16.7 ms Board-frame gates.

Thin Electron work implemented:

- isolated exact pins for Electron `44.2.0`, `@electron/packager` `20.3.0`, and `@electron/fuses` `2.1.3`;
- a secure custom packaged-content protocol with a five-file allowlist and restrictive content policy;
- sandboxed, context-isolated rendering without Node, webview, worker/subframe Node, external navigation/window, permission, or DevTools exposure;
- command-specific preload and main-process sender/request validation;
- a native PDF/image picker that returns opaque handles while absolute paths remain host-side;
- global and synthetic Case C-03 deep-link activation only;
- deterministic policy and wiring tests; and
- current-host Windows/macOS packaging with ASAR integrity and verified restrictive fuses.

The package recipe has not produced a recorded Windows or macOS observation. The test observations are synthetic fixtures that prove assessor behavior. Source, tests, staging, or an unsigned package command do not establish package size, startup, memory, accessibility, recovery, signed update, or production support.

Electron remains first in the measurement order because it best matches the current web/Chromium foundation. Tauri remains the required comparator. React and every other final renderer choice remain Decision required.

## Remaining ADR queue

Create measured spikes, not preference essays:

1. Complete packaged Electron Windows/macOS observations against ADR 0003.
2. Build the equivalent Tauri adapter and make an evidence-based host decision.
3. Decide renderer framework and state boundaries.
4. Decide canvas engine, accessibility model, operation log, and serialization.
5. Decide encrypted account-bound local cache and recovery.
6. Decide modular-monolith API, PostgreSQL, object storage, and outbox/worker.
7. Decide realtime replay, deduplication, convergence, and revocation.
8. Decide AI provider/tool boundary, schema validation, and citation verifier.
9. Decide legal research provider/source registry.
10. Harden packaging, signing, update, and rollback.
11. Select marketplace identity/payment providers only before marketplace work.

Every ADR includes context, measurable criteria, prototypes, Windows/macOS results, security/accessibility, cost/size, alternatives, migration, and rollback. The static shell, boundary, and thin adapter are reusable evidence infrastructure, not a silent renderer or production-host decision.

## First target vertical slice

User outcome: a new user installs/opens the supported desktop build, creates or recovers an account, completes five-page onboarding, enters an authorized workspace, closes/reopens, and recovers from interrupted connectivity without losing progress.

Include secure session/sign-out; onboarding preferences; persisted System/Light/Dark behavior; encrypted minimal cache and draft recovery; workspace creation/switching; complete recovery states; keyboard/focus/screen-reader paths; privacy-safe telemetry; and synthetic plus signed-build smoke coverage. Evidence upload, case AI, realtime Room, marketplace, and the marketing site remain non-goals for this slice.

## Migration and architecture invariants

- Keep CaseFind runnable until target replacements prove critical behavior.
- Import through a versioned bundle rather than reading old IndexedDB directly.
- Preserve original bytes/hashes, accepted/provisional states, unresolved conflicts, and an unchanged-source backup.
- Never silently promote old suggestions into accepted facts.
- Default-deny server authorization for every read, write, subscription, download, AI retrieval, export, and share.
- Keep immutable originals separate from derivatives.
- Perform revision checks and transactional invariants inside writes with idempotency and outbox behavior.
- Treat prompt/tool output as untrusted and disallow cross-case retrieval by default.
- Require deterministic policy and user approval for material AI actions.
- Propagate delete/revoke to caches, search, embeddings, realtime, downloads, and derivatives.
- Make no E2EE claim while server processing needs plaintext.

## Focused pull-request sequence

Completed: repository readiness repair, connected-prototype preservation, accessible static shell, candidate-neutral desktop boundary/evidence harness, cleanup audit, and thin Electron adapter source.

1. Complete the Electron synthetic fixture and exact Windows/macOS observations.
2. Build and measure the Tauri comparator, then record or defer the production-host decision.
3. Run renderer-framework and canvas/operation/structured-outline measured spikes.
4. Build authentication/session/recovery skeleton.
5. Build five-page onboarding with persisted preferences.
6. Build workspace switching, reconnect, and draft recovery.
7. Build Cases, Story Field, and Brief.

Prefer one observable outcome per PR. Keep temporary spike diagnostics and generated packages off `main`; keep durable automated tests with the code they protect.
