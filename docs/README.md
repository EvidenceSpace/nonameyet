# EvidenceSpace documentation map

This repository intentionally contains both the **current CaseFind prototype record** and the **approved EvidenceSpace target**. Code and tests prove current behavior; product/design/engineering contracts define the destination.

## Start and continuity

1. [`../AGENTS.md`](../AGENTS.md)
2. [`../AGENT.md`](../AGENT.md)
3. [`../handoff/00-START-HERE.md`](../handoff/00-START-HERE.md)
4. [`../HANDOFF.md`](../HANDOFF.md)
5. the relevant canonical contract below
6. current implementation, tests, open work, and CI

The complete handoff archive is indexed at [`../handoff/README.md`](../handoff/README.md).

## Status language

- **Current** — implemented on the referenced branch and verified by named evidence.
- **Partial** — real behavior exists but target coverage is incomplete.
- **Target V1** — accepted behavior, not necessarily implemented.
- **Future** — deliberately postponed.
- **Decision required** — implementation must wait for an ADR or explicit product decision.

## Precedence

1. Explicit user-approved decisions and newer accepted ADRs.
2. Root `AGENTS.md` trust and operating rules.
3. `docs/product/` target behavior.
4. `docs/design/approved-application-system.md` for approved placement and interaction.
5. `docs/engineering/` implementation constraints.
6. older design explorations and current CaseFind slice records.
7. `HANDOFF.md` for status and routing only.
8. code/tests as evidence of what currently exists.

When documents conflict, resolve the conflict in the same PR. A design artifact never overrides authorization, provenance, accessibility, or safety.

## Product

- [`product/vision-and-principles.md`](product/vision-and-principles.md)
- [`product/information-architecture.md`](product/information-architecture.md)
- [`product/page-specifications.md`](product/page-specifications.md)
- [`product/page-and-feature-matrix.md`](product/page-and-feature-matrix.md) — approved page placement, states, data, AI, V1/future, and implementation notes.
- [`product/board-and-ai-copilot.md`](product/board-and-ai-copilot.md)
- [`product/collaboration-and-lawyer-marketplace.md`](product/collaboration-and-lawyer-marketplace.md)
- [`product/roadmap.md`](product/roadmap.md)
- [`product/marketing-site-later.md`](product/marketing-site-later.md)

## Approved design

- [`design/approved-application-system.md`](design/approved-application-system.md) — design approval record and exact connected system.
- [`design/app-experience-blueprint.md`](design/app-experience-blueprint.md) — broader rationale and earlier composition detail.
- [`design/design-system-foundation.md`](design/design-system-foundation.md)
- [`design/motion-and-engagement.md`](design/motion-and-engagement.md)
- [`design/ux-quality-bar.md`](design/ux-quality-bar.md)
- [`../design-prototypes/README.md`](../design-prototypes/README.md)

The application design direction was approved on 30 August 2026. Small bar/tab/route defects are tracked as implementation design debt; they do not reopen the overall structure.

## Engineering

- [`engineering/target-architecture.md`](engineering/target-architecture.md)
- [`engineering/domain-model.md`](engineering/domain-model.md)
- [`engineering/security-ai-governance.md`](engineering/security-ai-governance.md)
- [`engineering/delivery-plan.md`](engineering/delivery-plan.md)
- [`engineering/next-phase-readiness.md`](engineering/next-phase-readiness.md)
- [`engineering/quality-standard.md`](engineering/quality-standard.md)
- [`engineering/quality-pass-checklist.md`](engineering/quality-pass-checklist.md)

## Decisions

- [`decisions/0001-evidencespace-target-product.md`](decisions/0001-evidencespace-target-product.md)
- [`decisions/0002-application-design-foundation-approved.md`](decisions/0002-application-design-foundation-approved.md)

## Current prototype records

Top-level files in `docs/` remain the implementation record for narrow CaseFind behavior: local storage, extraction, OCR, source-linked facts/timeline, review states, conflict handling, backup/restore, deletion, reports, accounts, and browser quality. Preserve them until a target vertical slice migrates or explicitly supersedes the behavior.

## Documentation verification

Run:

```bash
npm run check:docs
```

This checks the canonical handoff/design routes and rejects machine-local paths or unresolved placeholders. It does not prove application behavior.
