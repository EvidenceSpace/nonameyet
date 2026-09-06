# EvidenceSpace

[![Quality](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml/badge.svg)](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml)

EvidenceSpace is an online Windows and macOS case workspace for preserving evidence, connecting material on a controlled 2D board, collaborating with authorized members, receiving truthful source-backed AI assistance, producing reviewed reports, and—on Premium—finding and booking a verified lawyer.

## Status: repository ready; accessible shell foundation implemented

Repository readiness and the approved connected prototype are complete. The repository now also contains a browser-rendered, framework-neutral EvidenceSpace shell foundation at [`web/evidencespace-shell.html`](web/evidencespace-shell.html). It implements semantic tokens, approved large-window geometry, eight global destinations, seven ordered case lenses, safe route and case-ID handling, context-aware active states, light/dark system behavior, narrow-window reflow, visible focus, skip navigation, forced-colors support, reduced-motion behavior, and deterministic/browser coverage.

This foundation is intentionally separate from the existing CaseFind entry point. It is **not** a final desktop host or renderer decision, and it does not claim cloud workspaces, authentication, persistence, realtime collaboration, AI, reports, or marketplace behavior is connected.

The application design direction was approved on **30 August 2026**. Minor alignment and route-state defects observed in review—especially some top-bar, active-tab, and cross-screen shell inconsistencies—are implementation design debt, not reasons to reopen the overall information architecture.

The approved case navigation is:

**Brief → Space → Evidence → Research → Work → Room → Reports**

The connected review also fixes the account/onboarding flow, global navigation, notification lifecycle, Settings system, marketplace-to-booking flow, canonical object backlinks, AI proposal review, and selective-sharing boundaries.

This repository is **not yet the complete EvidenceSpace application**. It still contains the substantial local-first browser prototype named **CaseFind**, focused on unpaid freelance payment disputes. Its immutable originals, hashing, provenance, local PDF/image processing, review states, conflict handling, backup/recovery, report logic, and deterministic/browser tests are migration assets—not proof that desktop, cloud, realtime, marketplace, or full-copilot behavior exists.

## Start here

- [`AGENTS.md`](AGENTS.md) — repository-wide operating and trust rules.
- [`AGENT.md`](AGENT.md) — compatibility entry point for tools that look for the singular name.
- [`handoff/00-START-HERE.md`](handoff/00-START-HERE.md) — exact takeover sequence.
- [`HANDOFF.md`](HANDOFF.md) — current consolidated handoff report.
- [`handoff/README.md`](handoff/README.md) — complete conversation, design, implementation, roadmap, and visual-snapshot index.
- [`docs/design/approved-application-system.md`](docs/design/approved-application-system.md) — approved application shell and interaction system.
- [`docs/product/page-and-feature-matrix.md`](docs/product/page-and-feature-matrix.md) — page-by-page V1 specification and future boundaries.
- [`docs/engineering/next-phase-readiness.md`](docs/engineering/next-phase-readiness.md) — exact next-phase work and ADR queue.
- [`docs/engineering/quality-pass-checklist.md`](docs/engineering/quality-pass-checklist.md) — practical quality gate.
- [`design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`](design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html) — preserved 37-screen connected design reference.

## Repository truth

| Area | Current in the repository | Accepted target |
| --- | --- | --- |
| Client | CaseFind browser prototype plus isolated EvidenceSpace static shell foundation | Online Windows/macOS desktop app |
| Shell | Tokenized route-state foundation with accessible responsive landmarks | Production shell hosted by the selected desktop/renderer stack |
| Storage | Browser-local IndexedDB for CaseFind | Permissioned cloud workspace plus encrypted recovery cache |
| Core workflow | Narrow payment-dispute organizer | Adaptive case workspace for real and educational matters |
| Main interaction | Forms/document workspace plus shell route placeholders | Brief plus seven connected case lenses centered on a 2D Space |
| AI | Extraction/review suggestions in CaseFind | Source-backed copilot with approval-gated actions |
| Collaboration | Not implemented | Room, comments, presence, tasks, shared Case AI |
| Professional help | Not implemented | Premium lawyer discovery, booking, payment, selective sharing |

Never describe a target capability as implemented. See [`docs/decisions/0001-evidencespace-target-product.md`](docs/decisions/0001-evidencespace-target-product.md) and [`docs/decisions/0002-application-design-foundation-approved.md`](docs/decisions/0002-application-design-foundation-approved.md).

## Immediate next phase

1. Require the complete strict quality gate for the shell foundation and every later exact branch head.
2. Run measured ADR spikes for desktop shell, renderer, canvas/operation model, local cache, and cloud/realtime boundaries; the static shell does not decide them.
3. Implement authentication, recovery, five-step onboarding, persisted preferences, workspace switching, reconnect, and draft recovery as the first target vertical slice.
4. Continue through Cases/Story Field/Brief, evidence provenance, Space, AI/research, Work, Room/notifications, reports, then Premium marketplace.
5. Keep CaseFind runnable until target replacements prove and migrate its trust-critical behavior.

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

The durable GitHub Actions workflow separates dependency/docs/assets/typecheck, deterministic tests, strict Chromium lifecycle, and the aggregate gate. Required checks must pass on the exact commit being merged; an earlier green run is not evidence for a later head.

## Product boundary

EvidenceSpace organizes case material and provides source-backed assistance. It does not authenticate evidence, decide guilt or liability, promise an outcome, impersonate a licensed lawyer, or silently mutate a workspace. Jurisdiction, contrary material, uncertainty, sources, visibility, and approval state must remain visible.
