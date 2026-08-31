# EvidenceSpace master handoff report

**Status:** design foundation approved; repository-readiness handoff prepared  
**Last reconciled:** 30 August 2026  
**Baseline `main` before this handoff:** `d983a7e8e720c164f2c3fab5bc6ced599ae2a5eb`  
**Audience:** a new human maintainer or advanced coding agent with no access to the prior conversation

## Takeover

Read [`handoff/00-START-HERE.md`](handoff/00-START-HERE.md), then the complete [`handoff/README.md`](handoff/README.md) index. Do not ask the user to repeat decisions already recorded there.

## What has been decided

EvidenceSpace will be an online desktop application for Windows and macOS. It welcomes individuals, professionals, investigators, students, and educators through adaptive language and templates without weakening truth, provenance, permissions, or safety.

The core loop is:

**capture → preserve → organize → understand → decide → act → review**

The design phase is now approved. The user explicitly accepted the main design and idea while noting small bar/tab/connection errors that should be corrected during implementation. Do not reopen the entire visual direction because of those defects. Use the approved system and resolve the recorded debt through component contracts, route-state tests, visual regression, and Windows/macOS review.

The canonical case lenses are:

1. Brief
2. Space
3. Evidence
4. Research
5. Work
6. Room
7. Reports

Global surfaces include authentication/recovery, five-step onboarding, Global Home, Cases, New Case Story Field, Find a Lawyer, Notifications, Settings, and support.

## Approved signature system

- Light-first, calm, high-clarity EvidenceSpace visual language with explicit System/Light/Dark appearance controls.
- A stable floating global rail, context-aware top bar, focused main frame, and contextual side panels.
- Seven connected case lenses rather than concentrating all functions on one page.
- Case Spine, provenance links, Context Lens, and AI Ghost Proposal patterns.
- Exact-object continuity across Case C-03, Evidence E-04, Research R-02, relation F-03, task W-01, Thread 15, report RP-01, and Booking B-07 in the synthetic review fixture.
- No platform emoji as primary product iconography.
- Motion explains cause and state; target interactive motion is 60 FPS with reduced-motion equivalents.

## Approved onboarding and Settings mapping

Account creation precedes onboarding. The onboarding pages are Profile, Legal context, Guidance, Accessibility, and First case. The first story is entered in New Case, not stored as a Settings preference.

Settings preserves durable onboarding choices and adds product administration:

- Profile & identity
- Legal & regional defaults
- Personalization: appearance and accessibility
- AI & guidance
- Notifications delivery preferences
- Privacy & sharing
- Security
- Workspace & members
- Connections
- Workspace history
- Billing
- Help & support

System appearance follows the operating-system theme automatically. Explicit Light or Dark disables automatic switching. Unread counts belong on the global Bell only; local notification settings never show an unread badge.

## Notification lifecycle

1. Bell badge count.
2. Compact in-app toast when the app is focused.
3. Privacy-safe Windows/macOS system notification when unfocused.
4. Click opens the in-app drawer while preserving the originating page.
5. “View all notifications” opens a dedicated route.
6. Selecting a notification returns to the exact object with a backlink.

## AI contract

The AI is a calm, professionally skeptical, source-backed case copilot—not a lawyer and not a hidden decision-maker. It must show reasoning, exact case sources, relevant legal/research sources, contrary material, assumptions, unknowns, qualitative uncertainty, and a justified next step.

AI actions begin as **NOT APPLIED** proposals. A material action follows:

**proposal → affected-object/source preview → authorization and revision checks → user edit/approval/rejection → idempotent execution → verification → audit → safe undo when possible**

Sharing, messaging, booking, payment, filing, retention changes, and deletion require dedicated confirmation. Undo can reverse an effect but cannot erase the receipt.

## Permissions and payment boundaries

- Workspace membership does not grant case access.
- Case access does not grant every object or private thread.
- Board placement does not grant source access.
- Private AI stays private until the user selects content, destination, and visibility.
- Payment does not grant case access.
- Lawyer sharing uses a recipient-specific package of selected, reviewed objects with permission, expiry, download policy, and audit.
- Consultation, engagement, and formal representation are separate states.

## Current implementation reality

`main` contains a substantial local-first CaseFind browser prototype. Preserve or deliberately migrate:

- immutable original bytes and SHA-256 identity;
- IndexedDB schemas and migrations;
- local PDF extraction and image OCR;
- typed extraction and AI contracts;
- source-linked facts and timeline events;
- suggested, confirmed, corrected, dismissed, and uncertain states;
- deterministic consistency review;
- retry, cancellation, malformed-input, and recovery paths;
- encrypted backup/restore concepts;
- report provenance and export checks;
- optional account/session foundations; and
- deterministic and Playwright coverage.

None of this proves the target desktop/cloud/realtime/marketplace experience is implemented.

## Repository and CI snapshot

Merged foundations:

- PR #93 — canonical product and engineering blueprint
- PR #94 — durable AI handoff
- PR #95 — application experience design foundation

Latest observed design-foundation check: `Typecheck, tests, assets, and browser lifecycle` failed in GitHub Actions. The integration exposes the failed check but not the job log, so the exact cause is unproven.

PR #87 contains a TypeScript version change, a broad CI restructuring, and unrelated implementation/test modifications. Its install job also failed and its remaining jobs were skipped. Do not merge it wholesale. First obtain the exact log or reproduce the install in an equivalent environment; extract only a proven minimal repair.

Older open PRs #86, #89, #90, and #92 predate the approved target/design system. Reconcile or extract narrow value; do not merge them as bundles and do not discard them without review.

## Next-phase sequence

1. **CI truth:** diagnose and minimally repair the failing install job. Record exact command and log.
2. **ADR spikes:** desktop shell, renderer framework, 2D canvas and operation model, encrypted cache/deep links, cloud/realtime skeleton.
3. **Design foundation implementation:** tokens, shell geometry, focus, keyboard, accessibility, themes, route ownership.
4. **First vertical slice:** authentication, recovery, five-page onboarding, persisted preferences, workspace switching, reconnect and draft recovery.
5. **Cases and Brief:** Story Field, case lifecycle, jurisdiction confirmation, overall situation and organization progress.
6. **Evidence:** immutable upload, processing, source viewer, derivatives, locators, library and search.
7. **Space:** board domain, structured outline, core interactions, timeline/tasks, AI ghost proposals, then realtime.
8. **AI and Research:** sourced Ask/Analyze/Plan/Research/Act, contrary material, citations, approval, audit, memory scope.
9. **Room and Notifications:** human-first collaboration, shared AI, conversions, reconnect and revocation.
10. **Reports and professional package:** review, redaction, versions, export, selective lawyer package.
11. **Premium marketplace:** verification, conflict screening, booking, payment, refunds, reviews, operations.
12. **Release hardening:** signed builds, accessibility/security audits, AI red-team, disaster recovery and staged launch.

## Explicit V1 exclusions

No native calls, broad private connectors, 3D case mode, required sound design, mobile app, background surveillance, autonomous filing/messaging/booking/payment/deletion, outcome prediction, or unqualified worldwide legal coverage.

## Future direction

V2+ may evaluate selected connectors, native consultation calls, optional 3D/spatial organization, opt-in sound, mobile secure capture, advanced jurisdiction packs, richer temporal/relationship analysis, enterprise policy/retention/SSO, and professional filing integrations. Every promotion into V1 needs an explicit scope decision and displaced-work analysis.

## Design debt accepted for implementation

- normalize top-bar ownership and active tab states;
- remove residual cross-screen rail inconsistencies;
- verify overlay drawers preserve origin while dedicated routes change context;
- align case-lens spacing and responsive collapse;
- complete 60 FPS Board interaction study and reduced-motion equivalent;
- polish notification motion and fix minor copy/alignment defects;
- validate all screens at normal, narrow, high-DPI, light, System, and Dark states;
- replace synthetic fixture counts with domain-driven values.

These are required quality work, not permission to redesign the entire application ad hoc.

## Continuity rule

After every material decision or merged vertical slice, update the canonical contract and the relevant handoff status in the same PR. Record exact verification and unverified areas. A future agent must be able to answer: what exists, what is target, what is future, what is blocked, what must never be compromised, and what should be built next.
