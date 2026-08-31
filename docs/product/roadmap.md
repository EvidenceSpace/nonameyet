# EvidenceSpace roadmap

This roadmap expresses dependency order, not calendar promises.

## Phase status

| Phase | Status | Evidence |
| --- | --- | --- |
| Product blueprint | Complete | PR #93 |
| Durable handoff | Complete | PR #94 and `handoff/` |
| Application design system | Approved | PR #95 plus 30 August connected review |
| Repository readiness | This handoff | canonical docs, agent entry, quality checklist, visual snapshots |
| Production engineering | Next | CI repair, ADR spikes, first vertical slice |
| Marketing website | Deferred | `marketing-site-later.md` |

Small shell/tab defects remain implementation design debt; the core design direction is closed unless usability, accessibility, security, or implementation evidence requires a scoped revision.

## Foundation to preserve

From CaseFind: immutable original identity, hashes and locators, typed extraction, review states, conflict visibility, processing recovery, backup/restore, report provenance, account/session concepts, and deterministic/browser tests.

## Milestone 0A — CI truth

- Obtain the exact failing Actions log or reproduce the job equivalently.
- Fix the smallest proven cause.
- Keep dependencies exact and Actions SHA-pinned.
- Do not merge PR #87 as a bundle.

**Exit:** dependency policy, workflow policy, install, generated assets, typecheck, deterministic tests, and browser tests report trustworthy independent results.

## Milestone 0B — Architecture decisions

Measured spikes and ADRs for:

- Electron vs Tauri;
- renderer/application framework;
- 2D canvas and operation/serialization model;
- encrypted account-bound local cache and deep links;
- modular-monolith API, Postgres, object storage, worker/outbox;
- realtime replay/convergence and permission revocation;
- AI/legal research provider boundaries;
- payment/marketplace provider boundaries later.

**Exit:** runnable Windows/macOS evidence, security review, performance measurements, migration and rollback.

## Milestone 1 — Design tokens and desktop shell

Implement tokens, floating rail, context-aware top bar, main frame, focus/keyboard model, System/Light/Dark, accessibility preferences, route ownership, loading/error/reconnect states, and privacy-safe notifications skeleton.

## Milestone 2 — Identity and five-step onboarding

Account creation, sign-in, recovery, secure session, Profile, Legal context, Guidance, Accessibility, First case, workspace creation/switching, persisted progress, draft recovery, reconnect.

## Milestone 3 — Cases and Brief

Cases library; Story Field with manual fallback; case type/jurisdiction confirmation; lifecycle; Brief with overall situation, organization progress, contrary material, unknowns, deadlines, tasks, activity, and one justified next step.

## Milestone 4 — Evidence foundation

Authorized upload/capture, immutable original, version/hash, malware/type/size preflight, derivatives, OCR/transcription, retries/cancellation, Evidence library/viewer, search, permissions, retention and deletion. Add CaseFind import with report and unchanged-source backup.

## Milestone 5 — Space

Board domain and structured outline; pan/zoom/select/move; evidence/research cards; text, notes, frames, photo frames, shapes, markers, stacks and groups; labeled semantic connectors; timeline; tasks; minimap/history/focus; recovery; AI ghost proposals. Add realtime only after the operation model and authorization are proven.

## Milestone 6 — AI copilot and Research

Ask, Analyze, Plan, Research, Act; context/visibility; case and legal citations; jurisdiction/freshness; contrary material; proposals, approval, audit, undo; private and shared memory boundaries; official-source-first research ledger and evaluations.

## Milestone 7 — Work, Room, and Notifications

Task/document-request workflow; authorized invitations and roles; messages, threads, mentions, decisions, pins, presence, deep links, conversions and shared AI; notification lifecycle, preferences, grouping, reconnect and revocation.

## Milestone 8 — Reports and professional package

Versioned source-linked reports, inclusion controls, review states, contrary/stale/private handling, redaction derivatives, accessible export, selective consultation package, recipient/expiry/download preview and audit.

## Milestone 9 — Premium Find a Lawyer

Entitlements; verified profiles; jurisdiction/practice/language/availability/pricing; ranking disclosure; conflict screening; consultation request; atomic slot hold; payment/webhooks/reconciliation/refunds; secure messaging; verified reviews and moderation.

## Milestone 10 — Release hardening

Signed Windows/macOS builds, secure update/rollback, accessibility audit, security review and independent penetration test, AI red-team, backup/restore and disaster recovery, privacy/export/deletion operations, marketplace/support runbooks, legal review, beta migration and staged rollout.

## V1 exclusions

Native voice/video, broad private connectors, background collection, 3D, required sound, mobile, autonomous external/destructive actions, outcome prediction, and unqualified worldwide coverage.

## V2+ candidates

Selected connectors; native consultation calls; optional 3D/spatial organization; opt-in sound; mobile capture; advanced jurisdiction packs; richer temporal/entity analysis; enterprise SSO/policy/retention/legal hold; permitted filing integrations.

A future feature enters V1 only through an explicit scope decision naming displaced work and new privacy, security, legal, operational, accessibility, and quality obligations.
