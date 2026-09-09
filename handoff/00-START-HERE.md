# Start here — takeover protocol

## First hour

1. Verify repository, `main`, exact head, open pull requests, current checks, and concurrent branches.
2. Read `AGENTS.md`, `AGENT.md`, and `HANDOFF.md`.
3. Read `handoff/IMPLEMENTATION-COMPENDIUM.md`, `handoff/APPROVED-SCREEN-CATALOG.md`, and `handoff/REPOSITORY-CONTINUITY-PROTOCOL.md`.
4. Read `docs/design/approved-application-system.md`, `docs/product/page-specifications.md`, `docs/product/page-and-feature-matrix.md`, and the relevant engineering/ADR contracts.
5. Open the exact approved prototype route for the intended UI surface.
6. Inspect current code, tests, open work, CI, migration state, and known failures.
7. State Current, Partial, Target V1, Future, Decision required, Blocked, and Rejected accurately.
8. Do not ask the user to repeat settled product or design decisions.

## First active task

Build one bounded, prototype-faithful slice covering Global Home, Cases, Case C-03 Brief, Evidence E-04, and Context Lens continuity. The approved HTML is the baseline. Refine, do not redesign.

Non-goals: full 37-route build, real case data, cloud identity, production AI, realtime collaboration, marketplace payment, final renderer selection, or production host selection.

## Before visual implementation

- Inspect the exact source screenshot, not only text specs or memory.
- Record what stays unchanged, the real defect, and the smallest improvement.
- Keep familiar words, short copy, restrained type, purposeful blank space, and limited causal motion.
- Reject generic cards, new palette/background systems, AI-generated decoration, and animation for its own sake.
- Compare the result beside the approved screen before showing or merging it.

## After the first slice

Resume measured Electron host evidence, build the required Tauri comparator, and decide or explicitly defer the production host. Then proceed through identity/onboarding and vertical product slices in roadmap order.

## Mindset

Be ambitious about usefulness and craft; conservative about truth, access, evidence, payments, and destructive actions. Challenge preferred narratives when sources disagree. Prefer clear recovery over cleverness. Never trade accessibility, provenance, or the approved product character for visual novelty.

Update canonical docs and the living handoff in the same pull request as every material change.