# ADR 0001: EvidenceSpace target product

- **Status:** Accepted product direction; implementation pending
- **Date:** 2026-08-26
- **Decision owner:** Product owner

## Context

The current repository implements a local-first browser prototype named CaseFind. It is narrowly focused on organizing records for unpaid freelance disputes. The prototype has strong trust foundations but does not provide the visual board, cloud collaboration, persistent case copilot, broad case adaptation, desktop distribution, or lawyer marketplace now required for EvidenceSpace.

Treating the repository as empty would discard useful work. Treating the prototype as if it already satisfies the new vision would be equally incorrect.

## Decision

EvidenceSpace will be built as an online desktop application for Windows and macOS. Its core experience is a permissioned case workspace containing:

1. adaptive onboarding and user profile;
2. a Case Home showing honest organization progress and overall situation;
3. an interactive 2D evidence board with uploads, visual elements, timeline components, labeled connections, and web research;
4. a persistent source-backed AI copilot that can analyze, plan, research, draft, and propose workspace actions;
5. explicit user approval, preview, audit, and undo for AI mutations;
6. realtime member collaboration through a case Room, comments, tasks, presence, and shared AI threads;
7. reviewed reports with evidence and research provenance; and
8. a premium verified lawyer directory, search, profile, booking, review, and selective case-sharing workflow.

EvidenceSpace will be available to individuals, legal professionals, teams, investigators, students, and educators. The core data model remains common; onboarding, language, defaults, and guidance adapt to role, case type, jurisdiction, and experience.

## Terminology decision

The product must use case-appropriate terminology instead of a universal “charges” label:

- criminal matters: possible offenses or charges and their elements;
- civil matters: claims, defenses, remedies, compensation, and damages;
- administrative matters: violations, complaints, appeals, and review routes;
- family matters: applications, rights, orders, and evidence;
- educational matters: clearly labeled simulations.

The AI asks when classification or governing jurisdiction is uncertain.

## Foundations to preserve

Migration should preserve and generalize these proven concepts from the current prototype:

- immutable originals and separate derivatives;
- SHA-256 identity and source locators;
- hostile-document and prompt-injection handling;
- structured model contracts and validation;
- suggestions that require review before becoming accepted case material;
- explicit conflict and uncertainty states;
- atomic storage transitions and failure recovery;
- privacy-safe logging;
- deterministic tests and browser lifecycle coverage; and
- reports that retain provenance and exclude unresolved material by default.

Code may be replaced when the target architecture requires it, but these invariants must survive.

## Material changes

- Local-only IndexedDB ceases to be the sole system of record; the target is an authorized cloud workspace with an encrypted local cache.
- Sign-in becomes required for collaborative V1 rather than an optional identity boundary.
- Supported cases expand beyond unpaid freelance disputes.
- The primary workspace becomes board-centered rather than a long document page.
- AI expands from file extraction to case-scoped assistance and approved actions.
- Collaboration, notifications, subscriptions, lawyer profiles, booking, and payments become new domains.
- Product UX prioritizes desktop workflows, while remaining responsive enough for narrow windows and accessibility zoom.

## Consequences

- This is a staged product and architecture migration, not a cosmetic rename.
- Existing local cases require an explicit migration/export decision before any old storage path is removed.
- Cloud storage, realtime collaboration, AI actions, and professional-service sharing require new threat models and authorization tests.
- Legal analysis cannot be labeled uniformly “supported” worldwide. The interface may accept any jurisdiction, while analysis displays source coverage and limitations.
- Current top-level docs remain an implementation record until their slices are replaced.

## Alternatives rejected

### Continue the narrow CaseFind product unchanged

Rejected because it does not satisfy the accepted board, AI, collaboration, and lawyer-discovery experience.

### Delete the prototype and begin without reviewing it

Rejected because the repository contains valuable provenance, extraction, recovery, and testing work that should inform the rebuild.

### Add all new features directly into the current static pages

Rejected because realtime collaboration, cloud authorization, a complex canvas, and cross-platform desktop behavior require explicit architecture boundaries and staged migration.

## Migration rule

No pull request may claim the transition complete merely because navigation or branding changed. A target slice becomes current only when its full user outcome, data boundary, permission model, failure recovery, tests, documentation, and supported desktop environments have been verified.