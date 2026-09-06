# EvidenceSpace master handoff report

**Status:** repository readiness complete; accessible static shell foundation implemented  
**Last reconciled:** 6 September 2026  
**`main` baseline for this implementation slice:** `fcc12ac9e1e04977f4bcefb7c7fa7bd0aa08a3da`  
**Audience:** a new human maintainer or advanced coding agent with no access to the prior conversation

## Takeover

Read [`handoff/00-START-HERE.md`](handoff/00-START-HERE.md), then the complete [`handoff/README.md`](handoff/README.md) index. Do not ask the user to repeat decisions already recorded there.

## What has been decided

EvidenceSpace will be an online desktop application for Windows and macOS. It welcomes individuals, professionals, investigators, students, and educators through adaptive language and templates without weakening truth, provenance, permissions, or safety.

The core loop is:

**capture → preserve → organize → understand → decide → act → review**

The design foundation approved on 30 August 2026 remains the implementation baseline. The user accepted the main design and idea while noting small bar/tab/connection errors that should be corrected during implementation. Do not reopen the entire visual direction because of those defects. Use the approved system and resolve the recorded debt through component contracts, route-state tests, visual regression, and Windows/macOS review.

The canonical case lenses are:

1. Brief
2. Space
3. Evidence
4. Research
5. Work
6. Room
7. Reports

The global rail owns Home, Cases, New case, Lawyers, Notifications, Security/help, Settings, and Account. Unread counts belong to the global Bell only. AI remains contextual and does not become an eighth case lens.

## Approved signature system

- Light-first, calm, high-clarity EvidenceSpace visual language with explicit System/Light/Dark appearance controls.
- A stable floating global rail, context-aware top bar, focused main frame, and contextual side panels.
- Seven connected case lenses rather than concentrating all functions on one page.
- Case Spine, provenance links, Context Lens, and AI Ghost Proposal patterns.
- Exact-object continuity across Case C-03, Evidence E-04, Research R-02, relation F-03, task W-01, Thread 15, report RP-01, and Booking B-07 in the synthetic review fixture.
- No platform emoji as primary product iconography.
- Motion explains cause and state; target interactive motion is 60 FPS with reduced-motion equivalents.

## Current repository reality

The existing CaseFind browser/local-first prototype remains runnable and preserves substantial provenance, processing, review, storage-failure, deletion-race, backup/restore, reporting, and test coverage. Its IndexedDB runtime is currently schema version 6. Preserve or deliberately migrate:

- immutable original bytes and SHA-256 identity;
- IndexedDB schemas and migrations;
- local PDF extraction and image OCR;
- typed extraction and AI contracts;
- source-linked facts and timeline events;
- suggested, confirmed, corrected, dismissed, and uncertain states;
- deterministic consistency review;
- retry, cancellation, malformed-input, and recovery paths;
- encrypted backup/restore concepts;
- report provenance and export checks; and
- deterministic and Playwright coverage.

The approved 37-screen connected design prototype is preserved at [`design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`](design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html).

The first target implementation slice is an isolated, browser-rendered shell at [`web/evidencespace-shell.html`](web/evidencespace-shell.html). It provides:

- semantic light/dark design tokens;
- approved large-window rail, top-bar, and main-frame geometry;
- all eight global destinations and seven canonical case lenses;
- context-aware parent/child active states and case-ID continuity;
- allowlisted route resolution and bounded case identifiers;
- one main landmark, one H1, skip navigation, visible focus, practical targets, forced-colors support, reduced motion, and narrow bottom-navigation reflow; and
- deterministic model tests plus focused Chromium coverage.

The route content is deliberately honest foundation copy. It does not invent production data or imply that cloud, authentication, collaboration, AI, research, reports, or marketplace services are connected.

## Architecture boundary

The static shell foundation does **not** decide:

- Electron versus Tauri;
- the final renderer framework;
- the canvas engine or collaboration operation model;
- cache, cloud, database, object-storage, realtime, identity, AI, research, payment, or marketplace providers; or
- packaging, signing, updater, and rollback design.

These remain Decision required and need measured spikes with Windows/macOS, accessibility, security, performance, package-size, migration, and rollback evidence.

## Approved onboarding and Settings mapping

Account creation precedes onboarding. The onboarding pages are Profile, Legal context, Guidance, Accessibility, and First case. The first story is entered in New Case, not stored as a Settings preference.

Settings preserves durable onboarding choices and adds Profile & identity, Legal & regional defaults, Personalization, AI & guidance, notification delivery, Privacy & sharing, Security, Workspace & members, Connections, Workspace history, Billing, and Help & support.

System appearance follows the operating-system theme automatically. Explicit Light or Dark disables automatic switching.

## Notification lifecycle

1. Bell badge count.
2. Compact in-app toast when the app is focused.
3. Privacy-safe Windows/macOS system notification when unfocused.
4. Click opens the in-app drawer while preserving the originating page.
5. “View all notifications” opens a dedicated route.
6. Selecting a notification returns to the exact authorized object with a backlink.

Only the shell-owned Bell and placeholder route exist today; durable notifications and operating-system delivery are target behavior.

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

## Repository and CI snapshot

Repository readiness was repaired and merged through PR #99. Its final diagnostic-free exact-head run `33973538762` passed dependency/docs/assets/typecheck, deterministic tests, strict Chromium lifecycle, and the aggregate gate. The connected prototype was preserved through PR #101; exact-head run `33973822119` passed the same four jobs. The durable workflow is `.github/workflows/quality.yml`, TypeScript is `5.8.3`, and no temporary diagnostic workflow belongs on `main`.

Closed without merge after selective extraction or supersession: PRs #87, #89, #90, #92, #97, #98, and #100. PR #86 remains open and predates the current storage schema and target architecture; review it for narrow value rather than merging the stale branch wholesale.

Every exact head must pass its own checks. Record the shell foundation’s final diagnostic-free run in PR #102 before merging; do not reuse the green status of PR #99 or #101 as evidence for a changed commit.

## Next-phase sequence

1. **ADR spikes:** desktop shell, renderer framework, 2D canvas and operation model, encrypted cache/deep links, cloud/realtime skeleton.
2. **First vertical slice:** authentication, recovery, five-page onboarding, persisted preferences, workspace switching, reconnect and draft recovery.
3. **Cases and Brief:** Story Field, case lifecycle, jurisdiction confirmation, overall situation and disclosed organization progress.
4. **Evidence:** immutable upload, processing, source viewer, derivatives, locators, library and search.
5. **Space:** board domain, structured outline, core interactions, timeline/tasks, AI ghost proposals, then realtime.
6. **AI and Research:** sourced Ask/Analyze/Plan/Research/Act, contrary material, citations, approval, audit, memory scope.
7. **Work, Room and Notifications:** task ownership, human-first collaboration, shared AI, conversions, reconnect and revocation.
8. **Reports and professional package:** review, redaction, versions, export, selective lawyer package.
9. **Premium marketplace:** verification, conflict screening, booking, payment, refunds, reviews, operations.
10. **Release hardening:** signed builds, accessibility/security audits, AI red-team, disaster recovery and staged launch.

## Explicit V1 exclusions

No native calls, broad private connectors, 3D case mode, required sound design, mobile app, background surveillance, autonomous filing/messaging/booking/payment/deletion, outcome prediction, or unqualified worldwide legal coverage.

## Design debt accepted for implementation

- normalize top-bar ownership and active tab states;
- remove residual cross-screen rail inconsistencies;
- verify overlay drawers preserve origin while dedicated routes change context;
- align case-lens spacing and responsive collapse;
- complete the 60 FPS Board interaction study and reduced-motion equivalent;
- polish notification motion and minor copy/alignment defects;
- validate screens at normal, narrow, high-DPI, light, System, and Dark states; and
- replace synthetic fixture counts with domain-driven values.

The shell foundation covers route ownership and baseline responsive/accessibility behavior but does not close the later desktop, board, visual-regression, or persisted-preference work.

## Continuity rule

After every material decision or merged vertical slice, update the canonical contract and relevant handoff status in the same PR. Record exact verification and unverified areas. A future agent must be able to answer: what exists, what is target, what is future, what is blocked, what must never be compromised, and what should be built next.
