# EvidenceSpace

[![Quality](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml/badge.svg)](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml)

EvidenceSpace is an online Windows and macOS case workspace for preserving evidence, connecting material on a controlled 2D board, collaborating with authorized members, receiving truthful source-backed AI assistance, producing reviewed reports, and—on Premium—finding and booking a verified lawyer.

## Status: foundations ready; recognizable product UI is next

Repository readiness, trustworthy CI, the approved 37-screen connected prototype, the accessible route-state shell, the host-neutral desktop boundary, and an unsigned thin Electron candidate are in the repository.

On the sanitized Windows reference device, Electron staging, x64 packaging, fuse verification, and normal executable startup succeeded after PR #112 fixed the V8 snapshot-fuse abort. This proves only that the current unsigned candidate can start on that device. It does not prove production desktop support, accepted design, deep-link restoration, native picker behavior, packaged Board performance, accessibility, signing/updating, macOS, or Tauri.

The current thin shell is a technical foundation and was explicitly rejected as final product UI. A later standalone visual exploration also drifted from EvidenceSpace and was rejected before any repository commit. The approved [`design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`](design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html) remains the visual and workflow source of truth.

The 9 September 2026 design clarification is simple: **refine, do not redesign**. Preserve the approved app’s recognizable visual character, make underused areas useful, reduce copy and oversized headings, use familiar human language, and keep motion restrained and purposeful. Do not substitute generic dashboard cards, arbitrary gradients, glass-heavy styling, AI-generated decoration, or animation everywhere.

## Human-made interface standard

EvidenceSpace should look and read like a carefully crafted product made by people who understand the user’s work—not like a generated dashboard, an AI showcase, or a collection of fashionable effects.

- Use familiar words and concrete actions. Keep legal precision where it matters, but never expose internal architecture, policy, or AI jargon as interface copy.
- Every sentence must justify the space it occupies. Do not over-explain ordinary controls or repeat the same status across several cards.
- Shorten or remove copy before shrinking it. Tiny helper text is not a fix for too much writing.
- Headings show hierarchy; they are not billboards. Routine screens should give most of their space to the user’s work.
- Make the design appealing through proportion, spacing, alignment, typography, useful content, and thoughtful states—not filler cards, generated imagery, excessive glass, arbitrary gradients, or effects without a job.
- Use animation only when it explains cause, movement, continuity, or status. Keep it brief, restrained, performant, and optional through reduced-motion behavior.
- Before accepting a screen, inspect it at delivery size and read its visible copy aloud. A user should quickly understand where they are, what matters, and what the primary action will do.

The approved prototype is the baseline, not a pixel-perfect excuse to preserve its weaknesses. Improve real problems while keeping the result recognizably EvidenceSpace.

The approved case navigation is:

**Brief → Space → Evidence → Research → Work → Room → Reports**

This repository is **not yet the complete EvidenceSpace application**. It still contains the substantial local-first browser prototype named **CaseFind**, focused on unpaid freelance payment disputes. Its immutable originals, hashing, provenance, local PDF/image processing, review states, conflict handling, backup/recovery, report logic, and deterministic/browser tests are migration assets—not proof that desktop, cloud, realtime, marketplace, or full-copilot behavior exists.

## Start here

- [`AGENTS.md`](AGENTS.md) — repository-wide operating and trust rules.
- [`AGENT.md`](AGENT.md) — compatibility entry point and required read order.
- [`handoff/00-START-HERE.md`](handoff/00-START-HERE.md) — exact takeover sequence.
- [`HANDOFF.md`](HANDOFF.md) — current consolidated handoff report.
- [`handoff/README.md`](handoff/README.md) — handoff archive index.
- [`handoff/IMPLEMENTATION-COMPENDIUM.md`](handoff/IMPLEMENTATION-COMPENDIUM.md) — page, section, build, V1, and future map.
- [`handoff/APPROVED-SCREEN-CATALOG.md`](handoff/APPROVED-SCREEN-CATALOG.md) — exact 37-screen visual catalog.
- [`handoff/REPOSITORY-CONTINUITY-PROTOCOL.md`](handoff/REPOSITORY-CONTINUITY-PROTOCOL.md) — mandatory living-documentation rule.
- [`docs/design/approved-application-system.md`](docs/design/approved-application-system.md) — approved application system and fidelity clarification.
- [`docs/product/page-specifications.md`](docs/product/page-specifications.md) — canonical page behavior.
- [`docs/product/page-and-feature-matrix.md`](docs/product/page-and-feature-matrix.md) — page placement, states, data, AI, V1, and future boundaries.
- [`docs/engineering/quality-standard.md`](docs/engineering/quality-standard.md) — professional quality standard.

## Repository truth

| Area | Current in the repository | Accepted target |
| --- | --- | --- |
| Client | CaseFind browser prototype plus isolated EvidenceSpace route-state shell | Online Windows/macOS desktop app |
| Visual UI | Approved 37-screen reference; no accepted production screen | Prototype-faithful tokenized product UI |
| Desktop | Unsigned thin Electron candidate starts on one Windows reference device | Signed and measured Windows/macOS host after Electron/Tauri comparison |
| Storage | Browser-local IndexedDB for CaseFind | Permissioned cloud workspace plus encrypted recovery cache |
| Core workflow | Narrow payment-dispute organizer | Adaptive case workspace for real and educational matters |
| AI | Extraction/review suggestions in CaseFind | Source-backed copilot with approval-gated actions |
| Collaboration | Not implemented | Room, comments, presence, tasks, shared Case AI |
| Professional help | Not implemented | Premium lawyer discovery, booking, payment, selective sharing |

Never describe a target capability as implemented.

## Immediate work

1. Build one bounded prototype-faithful slice: Global Home, Cases, Case C-03 Brief, Evidence E-04, and Context Lens continuity.
2. Compare each changed view directly with its approved source screen at Windows-like, narrow, light/dark/System, focus, loading, empty, error, and recovery states.
3. Keep copy short and understandable; preserve the approved composition while fixing real defects.
4. Resume Electron host observations, build the required Tauri comparator, and decide or explicitly defer the production host.
5. Continue through identity/onboarding, Cases/Story Field/Brief, Evidence, Space, AI/Research, Work/Room/Notifications, Reports, and the Premium marketplace.
6. Keep CaseFind runnable until target replacements prove and migrate its trust-critical behavior.

The application comes before the promotional website.

## Development

Requirements: Node.js 22–24 and Python 3 for static preview commands.

```bash
npm install
npm run check:dependencies
npm run check:workflow-actions
npm run sync:pdfjs
npm run check:docs
npm run typecheck
npm test
npm run test:browser
npm run check
npm run preview
```

The durable workflow separates dependency/docs/assets/typecheck, deterministic tests, strict Chromium lifecycle, and the aggregate gate. Required checks must pass on the exact commit being merged; an earlier green run is not evidence for a later head.

## Product boundary

EvidenceSpace organizes case material and provides source-backed assistance. It does not authenticate evidence, decide guilt or liability, promise an outcome, impersonate a licensed lawyer, or silently mutate a workspace. Jurisdiction, contrary material, uncertainty, sources, visibility, and approval state must remain visible.