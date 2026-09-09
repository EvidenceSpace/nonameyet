# Next-phase engineering readiness

**Status:** repository and CI readiness complete; approved design preserved; thin Electron candidate starts on the sanitized Windows reference device; prototype-faithful product UI and complete host evidence remain pending.

## Current verified baseline

- `main`: `fd22c47e3d6f6353636604ad108be3bca963819a` after PR #112.
- Durable CI: dependency/docs/assets/typecheck, deterministic tests, Chromium lifecycle, and aggregate quality.
- Approved connected prototype: 37 embedded 1920×1080 synthetic screens, preserved unchanged.
- Electron: secure thin candidate, deterministic fixture/measurement contracts, staging, packaging, fuse verification, and normal Windows startup observed.
- Product UI: the current thin shell is a route/accessibility foundation, not accepted visual product work.
- Production host, renderer, canvas engine, cloud stack, and providers: Decision required.

## Design gate before the next product implementation

The user reaffirmed on 9 September 2026 that the approved prototype is the best visual baseline. A standalone alternative direction was rejected and was never committed.

Before coding a changed surface:

1. inspect its exact screenshot in the canonical prototype;
2. identify what stays, the actual defect, and the smallest improvement;
3. preserve recognizable palette, geometry, navigation, density, and composition;
4. shorten copy, reduce oversized hierarchy, and use familiar vocabulary;
5. make blank areas useful without generic cards or decorative filler;
6. specify focus, keyboard, reduced motion, narrow, dark/System, empty, loading, denied, error, and recovery behavior; and
7. compare the implementation beside the source screen before publication.

## Desktop boundary and Electron evidence

Implemented foundations:

- protocol-v1 allowlisted native envelopes;
- capabilities discovery and evidence-picker request;
- privacy-safe deep-link grammar;
- deny-by-default desktop security baseline;
- Electron/Tauri × Windows/macOS evidence matrix;
- exact source/artifact binding;
- secure packaged-content protocol and restrictive BrowserWindow/preload settings;
- deterministic Board fixture and bounded p95 assessor;
- observation capture with privacy-safe schema;
- Windows-compatible staging and package metadata; and
- V8 snapshot fuse configuration consistent with packaged assets.

Observed:

- Windows staging completed;
- unsigned Windows x64 package completed;
- configured fuses verified;
- normal executable opened without the prior V8 snapshot abort.

Not observed or not accepted:

- cold or existing-instance deep link reaching Evidence E-04;
- native picker boundary;
- accepted packaged Board frame result;
- startup timing or memory;
- renderer interruption recovery;
- operating-system accessibility tree;
- signed updater rejection and rollback;
- representative macOS behavior;
- Tauri comparator; and
- production host selection.

The user redirected immediate work from more thin-shell validation to recognizable product design. Resume remaining host evidence after the first faithful slice unless it blocks that slice.

## Active implementation slice

User outcome: recognize and navigate a useful EvidenceSpace product surface that remains faithful to the approved app rather than a generic placeholder shell.

Initial route set:

- Global Home;
- Cases;
- Case C-03 Brief;
- Evidence E-04;
- Context Lens and exact-object continuity.

Non-goals for this slice: cloud identity, real evidence ingestion, production AI, realtime collaboration, marketplace payment, host selection, and complete 37-route implementation.

Acceptance includes concise human copy, source-linked synthetic fixture data, no visual drift, real route state, keyboard/focus behavior, responsive collapse, System/Light/Dark, reduced motion, forced colors, local tests, side-by-side visual inspection, staging, remote diff inspection, exact-head CI, and updated handoff.

## Remaining ADR queue

1. Complete packaged Electron Windows/macOS observations.
2. Build equivalent Tauri adapter and make or defer the host decision.
3. Measure renderer framework and state boundaries.
4. Measure canvas engine, structured outline, operation log, serialization, replay, convergence, and undo.
5. Specify encrypted account-bound local cache and recovery.
6. Specify modular-monolith API, PostgreSQL, object storage, and outbox/worker.
7. Specify realtime replay, deduplication, convergence, and revocation.
8. Specify AI provider/tool boundary, schema validation, and citation verifier.
9. Specify legal research provider/source registry.
10. Harden packaging, signing, update, and rollback.
11. Select marketplace identity/payment providers only before marketplace implementation.

## Migration strategy

- Keep CaseFind runnable until target replacements prove critical behavior.
- Define a versioned import bundle rather than reading old IndexedDB directly from the new domain.
- Preserve original bytes/hashes, accepted/provisional states, and unresolved conflicts.
- Produce an import report and unchanged-source backup.
- Never silently promote old suggestions into accepted facts.

## Repository rule

Durable code, tests, contracts, ADRs, page specifications, and handoff updates merge to `main` after applicable gates pass. Temporary packages, raw observations, screenshots, recordings, traces, generated diagnostic output, private data, and machine-specific paths stay out. See `../../handoff/REPOSITORY-CONTINUITY-PROTOCOL.md`.