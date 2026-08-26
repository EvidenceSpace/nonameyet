# EvidenceSpace documentation map

This directory contains both the **current CaseFind prototype record** and the **accepted EvidenceSpace target blueprint**. Keeping both is intentional: contributors need an honest account of what exists and a clear description of what is being built.

## Continuity handoff

Root [`HANDOFF.md`](../HANDOFF.md) preserves the approved product-conversation decisions, current repository snapshot, pull-request/CI context, unresolved choices, implementation order, merge preference, and takeover protocol for a new human or advanced AI maintainer.

Read it at the start of a new development handoff. It is a status and routing document—not permission to override a canonical product, engineering, design, or ADR contract. Update it when a material decision, implementation milestone, blocker, or next-work sequence changes; do not duplicate every minor code edit.

## Status language

Every material product or architecture document should use these labels consistently:

- **Current** — implemented on the referenced branch and covered by the stated checks.
- **Partial** — a real workflow exists, but coverage or production readiness is incomplete.
- **Target V1** — accepted product behavior that is not necessarily implemented.
- **Future** — intentionally postponed beyond V1.
- **Decision required** — no implementation may assume an answer until an ADR or approved product decision exists.

Never use “supported,” “secure,” “verified,” “realtime,” “professional,” or “production-ready” without naming the implementation and evidence behind the claim.

## Precedence

When documents disagree:

1. The user-approved product decision or newer accepted ADR wins.
2. Root [`AGENTS.md`](../AGENTS.md) defines repository-wide operating and trust rules.
3. Target product contracts in `docs/product/` define the destination.
4. Target engineering contracts in `docs/engineering/` define how the destination should be reached.
5. Existing top-level slice documents describe the current prototype behavior until the affected code is migrated.
6. Root `HANDOFF.md` reports continuity and current status but cannot make an unimplemented feature real or overrule a canonical contract.
7. Code and tests are the evidence for current behavior. A document cannot make an unimplemented feature real.

Resolve contradictions in the same pull request that changes behavior. Do not quietly choose the most convenient document.

## Target product blueprint

- [`product/vision-and-principles.md`](product/vision-and-principles.md) — mission, audiences, trust model, and product outcomes.
- [`product/information-architecture.md`](product/information-architecture.md) — app shell, navigation, screen hierarchy, and routes.
- [`product/page-specifications.md`](product/page-specifications.md) — page-by-page content, actions, states, AI behavior, and acceptance criteria.
- [`product/board-and-ai-copilot.md`](product/board-and-ai-copilot.md) — board layout, object types, evidence provenance, AI modes, memory, research, and approvals.
- [`product/collaboration-and-lawyer-marketplace.md`](product/collaboration-and-lawyer-marketplace.md) — room, roles, shared/private conversations, lawyer profiles, booking, and reviews.
- [`product/roadmap.md`](product/roadmap.md) — build sequence, V1 boundaries, later releases, and exit criteria.
- [`product/marketing-site-later.md`](product/marketing-site-later.md) — deferred website goals, information architecture, creative direction, trust rules, and readiness gate.

## Target engineering blueprint

- [`engineering/target-architecture.md`](engineering/target-architecture.md) — desktop, cloud, realtime, files, workers, AI, search, payments, and observability boundaries.
- [`engineering/domain-model.md`](engineering/domain-model.md) — canonical entities, states, relationships, and invariants.
- [`engineering/security-ai-governance.md`](engineering/security-ai-governance.md) — authorization, privacy, prompt-injection defense, legal-source governance, and lawyer sharing.
- [`engineering/delivery-plan.md`](engineering/delivery-plan.md) — vertical implementation slices and dependency order.
- [`engineering/quality-standard.md`](engineering/quality-standard.md) — required quality pass, AI evaluations, cross-platform checks, and release gates.
- [`design/ux-quality-bar.md`](design/ux-quality-bar.md) — interaction, accessibility, visual, content, board, and performance standards.

## Decisions

- [`decisions/0001-evidencespace-target-product.md`](decisions/0001-evidencespace-target-product.md) — transition from the CaseFind prototype to the EvidenceSpace target.

New lasting decisions belong in `docs/decisions/NNNN-short-title.md` and must include context, decision, alternatives, consequences, migration, and rollback.

## Current prototype record

The existing top-level files in `docs/` describe narrow, implemented or partially implemented CaseFind slices such as:

- local case creation and library behavior;
- file ingestion, PDF extraction, image OCR, and processing recovery;
- AI extraction contracts and source grounding;
- source-linked facts, timeline events, and consistency review;
- encrypted backup, restore, archive, deletion, and report generation;
- account/session boundaries and current local-only storage;
- browser, dependency, workflow, and continuous quality gates.

These files remain useful engineering evidence. They must not be deleted merely because the product direction changed. Migration work should either update the canonical target contract and relevant slice document together or mark the old slice as superseded with a link to its replacement.
