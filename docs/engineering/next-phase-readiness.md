# Next-phase engineering readiness

**Status:** design approved; implementation not started for the target desktop/cloud product.

## Gate 1 — trustworthy CI

The last observed quality job failed within seconds. The available integration reports the failed check but not its log. PR #87 also has a failed install job and bundles a TypeScript change, CI expansion, implementation and test changes.

Required approach:

1. obtain the exact Actions log or reproduce the current workflow in an equivalent clean environment;
2. record the first failing command and complete output;
3. create a minimal branch changing only the proven cause and directly required evidence;
4. run dependency/workflow policy, install, generated-asset drift, typecheck, deterministic tests and browser tests;
5. keep unrelated PR #87 work out;
6. verify exact remote head and required checks.

Do not guess that TypeScript, Node, Actions, npm or networking is the cause.

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

Every ADR includes context, measurable criteria, prototypes, Windows/macOS results, security/accessibility, cost/size, alternatives, migration and rollback.

## Recommended repository shape — decision required

Do not assume a monorepo tool before the ADR. The target boundaries should support:

- desktop host;
- renderer/design system;
- domain and runtime schemas;
- API modular monolith;
- worker/processing;
- shared authorization/provenance contracts;
- database migrations;
- tests/evaluations;
- design artifacts and docs.

Domain objects must not depend on the canvas vendor or desktop bridge.

## First vertical slice

User outcome: a new user installs/opens the supported desktop build, creates or recovers an account, completes five-page onboarding, enters an authorized workspace, closes/reopens, and recovers from interrupted connectivity without losing progress.

Include:

- secure session and sign-out;
- profile, legal defaults, guidance, accessibility, first-case readiness;
- System/Light/Dark behavior;
- encrypted minimal cache and draft recovery;
- workspace creation/switching;
- loading, offline-temporary, reconnecting, denied, expired, update-required and fatal recovery states;
- keyboard/focus/screen-reader path;
- privacy-safe telemetry;
- synthetic tests and signed-build smoke path when available.

Non-goals: evidence upload, case AI, realtime Room, marketplace, marketing site.

## Second vertical slice

Cases Library + New Case Story Field + Brief with manual fallback. No dependence on AI availability. Confirm case classification and jurisdiction. Organization progress must expose its inputs and must not imply outcome probability.

## Migration strategy

- Keep CaseFind runnable until target replacements prove critical behavior.
- Define a versioned import bundle rather than reading old IndexedDB directly from the new domain.
- Preserve original bytes/hashes, accepted/provisional states and unresolved conflicts.
- Produce an import report and unchanged-source backup.
- Never silently promote old suggestions into accepted facts.

## Architecture invariants

- default-deny server authorization for reads, writes, subscriptions, downloads, AI retrieval, exports and lawyer sharing;
- immutable original plus separate derivatives;
- current-revision checks inside writes;
- idempotency for retried commands and provider/webhook events;
- transactional multi-record invariants and outbox;
- prompt/tool output treated as untrusted;
- no cross-case retrieval by default;
- AI cannot execute material actions without deterministic policy and user approval;
- delete/revoke propagates to cache, search, embeddings, realtime, downloads and derivatives;
- no E2EE claim while server processing needs plaintext.

## Pull-request order

1. Minimal CI repair.
2. ADR/spike harness and first desktop decision.
3. Renderer/design tokens and accessible shell.
4. Authentication/session skeleton.
5. Five-page onboarding vertical slice.
6. Workspace switch/reconnect/recovery.
7. Cases/Story Field/Brief.

Prefer one observable user outcome per PR. Keep testers and temporary spike diagnostics off `main`; keep durable automated tests with the code they protect.
