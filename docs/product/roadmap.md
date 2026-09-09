# EvidenceSpace roadmap

This roadmap expresses dependency order, not calendar promises.

## Phase status

| Phase | Status | Evidence |
| --- | --- | --- |
| Product blueprint | Complete | PRs #93–#95 and canonical product documents |
| Durable handoff | Active living record | `HANDOFF.md`, `handoff/`, and the continuity protocol |
| Application design system | Approved and reaffirmed | 30 August approval plus 9 September fidelity clarification |
| Repository readiness and CI truth | Complete | PR #99 and later exact-head quality runs |
| Accessible shell and desktop boundary | Partial | PRs #102–#112 |
| Prototype-faithful product UI | Active next slice | Approved 37-screen prototype; no accepted production screen yet |
| Production engineering | In progress | Electron candidate partial; host/renderer/canvas decisions still open |
| Marketing website | Deferred | `marketing-site-later.md` |

Small shell/tab defects remain implementation design debt. The current thin shell and a later standalone visual exploration were not accepted as product UI. The next UI work must refine the approved 37-screen system rather than replace it.

## Foundation to preserve

From CaseFind: immutable original identity, hashes and locators, typed extraction, review states, conflict visibility, processing recovery, backup/restore, report provenance, account/session concepts, and deterministic/browser tests.

From the approved EvidenceSpace review: floating shell geometry, light atmospheric visual identity, seven case lenses, exact-object continuity, Case Spine, Provenance Rail, Context Lens, Ghost Proposal, simple language, concise typography, and purposeful motion.

## Milestone 0A — CI truth: complete

Dependency policy, workflow policy, generated assets, documentation, typecheck, deterministic tests, Chromium lifecycle, and aggregate quality are independent durable gates. Every changed exact head must pass its own applicable checks.

## Milestone 0B — desktop evidence: partial

Completed foundations include the protocol-v1 desktop boundary, secure thin Electron candidate, deterministic Board fixture and assessor, deep-link plumbing, observation capture, Windows staging/package fixes, deterministic author metadata, and the V8 snapshot-fuse correction.

Observed on the sanitized Windows reference device: staging, x64 packaging, fuse verification, and normal executable startup. The visual shell was explicitly not accepted. Real deep-link destination, picker boundary, packaged Board performance, startup timing, memory, accessibility tree, signing/updater/rollback, macOS, and Tauri remain unverified.

Host evidence continues after the prototype-faithful visual slice unless it becomes blocking. This does not select Electron for production; Tauri remains the required comparator.

## Milestone 1 — approved design tokens and product shell: active

Implement one bounded, prototype-faithful vertical slice before scaling across routes:

1. preserve the approved rail, top bar, main frame, palette, spacing rhythm, and page composition;
2. implement Global Home, Cases, Case C-03 Brief, Evidence E-04, and Context Lens continuity;
3. use concise human copy and smaller hierarchy where the source is too dense;
4. improve blank space with meaningful state, source-linked content, progress, or interaction—not filler cards;
5. add only causal, performant motion with reduced-motion behavior;
6. cover keyboard, focus, forced colors, narrow windows, light/dark/System, loading, empty, denied, stale, error, and recovery states; and
7. compare screenshots beside the approved source before review.

**Exit:** the user recognizes the approved application, the slice works through real route state, applicable tests pass, and the handoff accurately records what is still synthetic.

## Milestone 2 — identity and five-step onboarding

Account creation, sign-in, recovery, secure session, Profile, Legal context, Guidance, Accessibility, First case, workspace creation/switching, persisted progress, draft recovery, and reconnect.

## Milestone 3 — Cases and Brief

Cases library; Story Field with manual fallback; case type/jurisdiction confirmation; lifecycle; Brief with overall situation, organization progress, contrary material, unknowns, deadlines, tasks, activity, and one justified next step.

## Milestone 4 — Evidence foundation

Authorized upload/capture, immutable original, version/hash, malware/type/size preflight, derivatives, OCR/transcription, retries/cancellation, Evidence library/viewer, search, permissions, retention, and deletion. Add CaseFind import with report and unchanged-source backup.

## Milestone 5 — Space

Board domain and structured outline; pan/zoom/select/move; evidence/research cards; text, notes, frames, photo frames, shapes, markers, stacks and groups; labeled semantic connectors; timeline; tasks; minimap/history/focus; recovery; AI ghost proposals. Add realtime only after the operation model and authorization are proven.

## Milestone 6 — AI copilot and Research

Ask, Analyze, Plan, Research, Act; context/visibility; case and legal citations; jurisdiction/freshness; contrary material; proposals, approval, audit, undo; private/shared memory boundaries; official-source-first research ledger and evaluations.

## Milestone 7 — Work, Room, and Notifications

Task/document-request workflow; authorized invitations and roles; messages, threads, mentions, decisions, pins, presence, deep links, conversions and shared AI; notification lifecycle, preferences, grouping, reconnect and revocation.

## Milestone 8 — Reports and professional package

Versioned source-linked reports, inclusion controls, review states, contrary/stale/private handling, redaction derivatives, accessible export, selective consultation package, recipient/expiry/download preview, and audit.

## Milestone 9 — Premium Find a Lawyer

Entitlements; verified profiles; jurisdiction/practice/language/availability/pricing; ranking disclosure; conflict screening; consultation request; atomic slot hold; payment/webhooks/reconciliation/refunds; secure messaging; verified reviews and moderation.

## Milestone 10 — release hardening

Signed Windows/macOS builds, secure update/rollback, accessibility audit, security review and independent penetration test, AI red-team, backup/restore and disaster recovery, privacy/export/deletion operations, marketplace/support runbooks, legal review, beta migration, and staged rollout.

## V1 exclusions

Native voice/video, broad private connectors, background collection, 3D, required sound, mobile, autonomous external/destructive actions, outcome prediction, and unqualified worldwide coverage.

## V2+ candidates

Selected connectors; native consultation calls; optional 3D/spatial organization; opt-in sound; mobile capture; advanced jurisdiction packs; richer temporal/entity analysis; enterprise SSO/policy/retention/legal hold; permitted filing integrations.

A future feature enters V1 only through an explicit scope decision naming displaced work and new privacy, security, legal, operational, accessibility, design-fidelity, and quality obligations.