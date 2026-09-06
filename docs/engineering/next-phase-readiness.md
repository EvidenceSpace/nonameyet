# Next-phase engineering readiness

**Status:** repository readiness complete; framework-neutral EvidenceSpace shell foundation implemented; target desktop/cloud architecture remains Decision required.

## Gate 1 — trustworthy CI: complete

Repository readiness was repaired in PR #99 without merging the stale broad PR #87. The durable workflow now separates:

1. dependency, workflow-policy, documentation, generated-asset, and typecheck verification;
2. deterministic tests;
3. strict Chromium lifecycle with CI flakes treated as failures; and
4. an aggregate gate.

PR #99 exact-head run `33973538762` passed all four jobs. PR #101 exact-head run `33973822119` independently passed the same gate for the preserved connected prototype. TypeScript is `5.8.3`; only `.github/workflows/quality.yml` belongs on `main`; temporary diagnostics must be removed before merge.

These runs establish the last merged baselines only. Every changed exact head must pass the full gate before merge.

## Current implementation slice — accessible shell foundation

The repository includes an isolated browser-rendered EvidenceSpace shell at `web/evidencespace-shell.html`. It does not replace the CaseFind entry point and does not choose a desktop host or renderer framework.

Implemented in this slice:

- semantic tokens with System/Light/Dark behavior;
- approved 22px/68px/108px large-window shell geometry;
- eight global destinations;
- Brief → Space → Evidence → Research → Work → Room → Reports;
- context-aware global parent and case-lens active states;
- stable case-ID continuity and allowlisted route recovery;
- one main landmark and H1, skip navigation, visible focus, practical targets, forced-colors support, reduced motion, and narrow bottom-navigation reflow; and
- deterministic model and focused Chromium tests.

Not implemented by this slice: persisted settings, identity, cloud workspaces, case domain data, collaboration, research providers, production AI, report generation, marketplace behavior, desktop packaging, or signed releases.

## Gate 2 — ADR queue

Create measured spikes, not preference essays:

1. Desktop shell: Electron vs Tauri.
2. Renderer framework and state boundaries.
3. Canvas engine, accessibility model, operation log and serialization.
4. Encrypted account-bound local cache, deep links and recovery.
5. Modular-monolith API, PostgreSQL, object storage, outbox/worker.
6. Realtime replay, deduplication, convergence and revocation.
7. AI provider/tool boundary, schema validation and citation verifier.
8. Legal research provider/source registry.
9. Packaging, signing, update and rollback.
10. Marketplace identity/payment providers only before marketplace work.

Every ADR includes context, measurable criteria, prototypes, Windows/macOS results, security/accessibility, cost/size, alternatives, migration, and rollback. The static shell is reusable evidence, not a silent renderer or desktop decision.

## Recommended repository shape — decision required

Do not assume a monorepo tool before the ADR. The target boundaries should support:

- desktop host;
- renderer/design system;
- domain and runtime schemas;
- API modular monolith;
- worker/processing;
- shared authorization/provenance contracts;
- database migrations;
- tests/evaluations; and
- design artifacts and docs.

Domain objects must not depend on the canvas vendor or desktop bridge.

## First target vertical slice

User outcome: a new user installs/opens the supported desktop build, creates or recovers an account, completes five-page onboarding, enters an authorized workspace, closes/reopens, and recovers from interrupted connectivity without losing progress.

Include:

- secure session and sign-out;
- profile, legal defaults, guidance, accessibility, first-case readiness;
- persisted System/Light/Dark behavior;
- encrypted minimal cache and draft recovery;
- workspace creation/switching;
- loading, offline-temporary, reconnecting, denied, expired, update-required, and fatal recovery states;
- keyboard/focus/screen-reader path;
- privacy-safe telemetry; and
- synthetic tests and signed-build smoke path when available.

Non-goals: evidence upload, case AI, realtime Room, marketplace, marketing site.

## Second target vertical slice

Cases Library + New Case Story Field + Brief with manual fallback. No dependence on AI availability. Confirm case classification and jurisdiction. Organization progress must expose its inputs and must not imply outcome probability.

## Migration strategy

- Keep CaseFind runnable until target replacements prove critical behavior.
- Define a versioned import bundle rather than reading old IndexedDB directly from the new domain.
- Preserve original bytes/hashes, accepted/provisional states, and unresolved conflicts.
- Produce an import report and unchanged-source backup.
- Never silently promote old suggestions into accepted facts.

## Architecture invariants

- default-deny server authorization for reads, writes, subscriptions, downloads, AI retrieval, exports, and lawyer sharing;
- immutable original plus separate derivatives;
- current-revision checks inside writes;
- idempotency for retried commands and provider/webhook events;
- transactional multi-record invariants and outbox;
- prompt/tool output treated as untrusted;
- no cross-case retrieval by default;
- AI cannot execute material actions without deterministic policy and user approval;
- delete/revoke propagates to cache, search, embeddings, realtime, downloads, and derivatives; and
- no E2EE claim while server processing needs plaintext.

## Focused pull-request sequence

Completed: repository readiness repair, connected-prototype preservation, and the accessible static shell foundation.

1. Desktop/renderer spike and ADR.
2. Canvas/operation/outline spike and ADR.
3. Authentication/session/recovery skeleton.
4. Five-page onboarding with persisted preferences.
5. Workspace switch/reconnect/draft recovery.
6. Cases/Story Field/Brief.

Prefer one observable user outcome per PR. Keep temporary spike diagnostics off `main`; keep durable automated tests with the code they protect.
