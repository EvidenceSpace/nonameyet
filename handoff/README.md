# EvidenceSpace handoff archive

This folder preserves the product conversation, approved design, current implementation reality, V1/V2 plan, trust boundaries, visual references, open risks, and takeover mindset. It contains synthetic material only.

## Read order

1. [`00-START-HERE.md`](00-START-HERE.md)
2. [`../HANDOFF.md`](../HANDOFF.md)
3. [`IMPLEMENTATION-COMPENDIUM.md`](IMPLEMENTATION-COMPENDIUM.md)
4. [`APPROVED-SCREEN-CATALOG.md`](APPROVED-SCREEN-CATALOG.md)
5. [`CURRENT-STATE-AND-NEXT-STEPS.md`](CURRENT-STATE-AND-NEXT-STEPS.md)
6. [`CONVERSATION-AND-DECISIONS.md`](CONVERSATION-AND-DECISIONS.md)
7. [`NEXT-AGENT-OPERATING-BRIEF.md`](NEXT-AGENT-OPERATING-BRIEF.md)
8. [`SESSION-LEDGER.md`](SESSION-LEDGER.md)
9. [`REPOSITORY-CONTINUITY-PROTOCOL.md`](REPOSITORY-CONTINUITY-PROTOCOL.md)
10. [`assets/README.md`](assets/README.md)

Then read the canonical product, design, engineering, security, AI, and ADR files under `docs/`. Handoff routes and records status; it does not override those contracts.

## Current snapshot

- Main design direction approved 30 August 2026 and explicitly reaffirmed 9 September 2026.
- The canonical prototype contains 37 embedded 1920×1080 screens and was reverified from the user’s original attachment.
- The governing visual rule is **Refine, do not redesign**.
- Repository/CI, accessible shell, desktop boundary, deterministic fixture, Electron staging/package path, and Windows startup correction are merged through PR #112.
- The unsigned Electron candidate starts on one sanitized Windows reference device; most host evidence, macOS, Tauri, and production decisions remain open.
- The current thin shell is not accepted visual product work.
- The next slice is prototype-faithful Home, Cases, Brief, Evidence E-04, and Context Lens.
- CaseFind remains the proven local-first implementation whose trust-critical behavior must be preserved or migrated.
- Marketing site is deferred.

## Canonical companions

- `docs/product/page-specifications.md`
- `docs/product/page-and-feature-matrix.md`
- `docs/product/roadmap.md`
- `docs/design/approved-application-system.md`
- `docs/design/ux-quality-bar.md`
- `docs/engineering/next-phase-readiness.md`
- `docs/engineering/quality-standard.md`
- `docs/engineering/quality-pass-checklist.md`
- `docs/decisions/0003-desktop-host-spike-protocol.md`
- `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`

## Safety

Do not store private case material, account secrets, raw tool/session identifiers, personal machine paths, production exports, rejected design artifacts, or unapproved diagnostic screenshots here. Durable automated tests stay with the code; disposable test output, packages, observations, traces, and recordings stay ignored.