# EvidenceSpace master handoff report

**Status:** repository/CI foundations complete; unsigned Electron startup observed on one Windows reference device; approved product UI implementation is the active priority  
**Last reconciled:** 9 September 2026  
**Last code-bearing `main` baseline:** `fd22c47e3d6f6353636604ad108be3bca963819a` (PR #112)  
**Audience:** a new human maintainer or advanced coding agent with no access to the prior conversation

## Takeover

Read [`handoff/00-START-HERE.md`](handoff/00-START-HERE.md), then [`handoff/README.md`](handoff/README.md). Do not ask the user to repeat decisions already recorded there.

The repository is the continuity source. After every material decision or merged slice, update the relevant canonical contract and handoff in the same pull request using [`handoff/REPOSITORY-CONTINUITY-PROTOCOL.md`](handoff/REPOSITORY-CONTINUITY-PROTOCOL.md).

## Current, target, and rejected work

### Current

- CaseFind remains a runnable browser/local-first implementation with substantial provenance, processing, review, recovery, deletion, backup/restore, reporting, and test foundations.
- The EvidenceSpace route-state shell provides navigation/accessibility scaffolding but is not accepted final product UI.
- The protocol-v1 desktop boundary and secure thin Electron adapter are implemented.
- The unsigned Electron candidate stages, packages, verifies fuses, and starts normally on the sanitized Windows reference device.
- The approved 37-screen prototype is preserved on `main` and was reverified from the user’s original attachment.

### Target V1

An online Windows/macOS EvidenceSpace application with adaptive onboarding, Cases and Story Field, Brief, Space, Evidence, Research, Work, Room, Reports, source-backed approval-gated AI, authorized collaboration, reviewed exports, and Premium lawyer discovery/booking/payment/selective sharing.

### Rejected

- The generic thin shell as final product design.
- A standalone six-route visual exploration created after the shell. It changed the palette, background, composition, copy density, and overall character too far from the approved app. It was never committed, pushed, or opened as a pull request.
- Disconnected or impossible screens, overly dark/congested boards, Threaded Casebook, generic chat intake, coding-competition/game concepts, outcome prediction, and decorative AI-heavy styling.

## Latest design decision

On 9 September 2026 the user corrected the visual direction:

- the approved HTML is the best design reference;
- improve it rather than replacing it;
- preserve its recognizable color scheme, atmosphere, geometry, navigation, and page composition;
- make blank areas engaging through purposeful content, progress, layout, and restrained interaction;
- make the interface feel human-made with familiar vocabulary;
- reduce copy and heading size;
- avoid generic cards, arbitrary gradients, AI-generated imagery, and animation everywhere; and
- use motion only when it is designed for the interaction and helps the user understand state.

The governing rule is **Refine, do not redesign**. See [`docs/design/approved-application-system.md`](docs/design/approved-application-system.md).

## Approved prototype integrity

Canonical file: [`design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`](design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html)

- Repository LF size: `5,226,405` bytes
- Git blob: `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`
- Canonical normalized SHA-256: `676f787dd69c5a0b41339faa519388e6eb9af0e05794133d4980ec7394443807`
- Embedded images: 37 unique WebP screenshots
- Dimensions: 1920×1080 each

The user’s reattached file was `5,226,610` bytes with `205` CRLF endings and raw SHA-256 `114d1e96debe2b6dda13a76782c55085ab6f479543a56a2c6f5071a921134c72`. CRLF-to-LF normalization exactly reproduced the canonical repository size and SHA-256. The prototype content is confirmed; do not replace or reformat it.

The HTML route structure is cataloged in [`handoff/APPROVED-SCREEN-CATALOG.md`](handoff/APPROVED-SCREEN-CATALOG.md). It uses one connected auth surface, five onboarding screens, three workspace screens, seven case screens, three professional-support screens, four attention states, and fourteen Settings screens.

## Product system

Core loop:

**capture → preserve → organize → understand → decide → act → review**

Canonical case lenses:

**Brief → Space → Evidence → Research → Work → Room → Reports**

Global destinations: Home, Cases, New case, Lawyers, Notifications, Security/help, Settings, and Account.

Signature patterns:

1. Case Spine
2. Provenance Rail
3. Context Lens
4. Ghost Proposal
5. Workspace receipt

Synthetic continuity fixture: Case C-03, Evidence E-04, Research R-02, Space relation F-03, task W-01, Thread 15, report RP-01, and booking B-07.

Non-negotiable boundaries:

- preserve original bytes and derivative lineage;
- every material AI claim and accepted derived object retains reachable sources;
- contrary material, uncertainty, jurisdiction, freshness, visibility, and AI state remain visible;
- AI proposes; authorized people decide;
- workspace membership does not grant case access;
- payment does not grant case access;
- private AI does not silently become shared;
- report export and external actions receive fresh permission/source checks; and
- Undo reverses effects without erasing receipts.

## Current implementation reality

### CaseFind

Preserve or deliberately migrate:

- IndexedDB schema version 6 and migrations;
- immutable originals and SHA-256 identity;
- local PDF extraction and image OCR;
- typed extraction/AI contracts;
- source-linked facts and timeline;
- suggested, confirmed, corrected, dismissed, and uncertain states;
- deterministic consistency review;
- retry, cancellation, malformed-input, storage-failure, and recovery paths;
- encrypted backup/restore concepts;
- report provenance/export checks; and
- deterministic and Playwright coverage.

### EvidenceSpace shell

Implemented: semantic tokens, eight global destinations, seven lenses, allowlisted routes, bounded case IDs, parent/child active state, one main landmark/H1, skip navigation, focus, forced colors, reduced motion, and narrow reflow.

Not accepted: visual fidelity, final page composition, production data/services, and final renderer/host.

### Electron candidate

Implemented: secure packaged-content protocol, restrictive BrowserWindow/preload boundary, sender/shape validation, opaque picker handles, external scheme plumbing, deterministic Board fixture/assessor, observation capture, explicit package allowlist, ASAR integrity, fuse verification, and Windows-compatible staging/package metadata.

Observed on Windows: staging, x64 packaging, fuse verification, and normal startup without the previous V8 snapshot abort.

Not observed or not accepted: actual deep-link arrival at Evidence E-04, native picker boundary, packaged Board threshold, startup/memory numbers, interruption recovery, OS accessibility tree, signing/updater/rollback, macOS, Tauri, and production-host selection.

## Repository and pull-request snapshot

Merged foundations include PRs #99–#112. PR #112 merged as `fd22c47e3d6f6353636604ad108be3bca963819a`; exact-head quality run `34261834685` passed all four durable jobs.

PR #86 remains open/on hold. It predates current storage and target architecture; mine only narrow proven value and never merge the stale branch wholesale.

`feat/product-shell-foundation-20260909` exists at the PR #112 baseline with no product commit and no pull request. Use it only after reconciling with current `main`; do not assume rejected local work exists there.

Historical branches have not been deleted. `main` protection remains unconfigured.

## Active next slice

Build one prototype-faithful vertical slice:

- Global Home;
- Cases;
- Case C-03 Brief;
- Evidence E-04;
- Context Lens and exact-object continuity.

Before coding each surface, inspect its exact approved screenshot. Preserve recognizable structure and state, identify the real defect, implement the smallest improvement, use concise human copy, and compare before/after at Windows-like and constrained widths. Include focus, keyboard, reduced motion, forced colors, System/Light/Dark, loading, empty, denied, stale, error, and recovery states where relevant.

Do not scale to all 37 surfaces until this visual and interaction direction is internally reviewed and recognized as the approved app.

## Later sequence

1. Resume cold/existing deep links, picker, packaged Board, startup, memory, accessibility, recovery, signing/updater, and macOS Electron evidence.
2. Build the equivalent Tauri comparator and decide or defer the production host.
3. Measure renderer and canvas/operation/structured-outline options.
4. Build identity, recovery, five-page onboarding, workspace switching, and draft recovery.
5. Build Cases/Story Field/Brief, Evidence, Space, AI/Research, Work/Room/Notifications, Reports, and marketplace in vertical slices.
6. Complete signing, release, security/accessibility audits, disaster recovery, legal/operational review, beta migration, and staged launch.

## Explicit V1 exclusions

No broad private connectors, native voice/video, background collection, 3D case mode, required sound, mobile app, autonomous filing/messaging/booking/payment/deletion, outcome prediction, or unqualified worldwide legal coverage.

## Continuity rule

Everything durable needed to build and operate the product belongs in the repository and ultimately on `main`: code, durable tests, specifications, ADRs, diagrams, runbooks, quality gates, and current handoff. Temporary packages, private screenshots, raw traces/observations, rejected explorations, personal paths, identifiers, and secrets stay out.

A future maintainer must be able to answer from the repository: what exists, what is partial, what is target, what is future, what was rejected, what is blocked, what must never be compromised, and what should be built next.