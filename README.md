# EvidenceSpace

[![Quality](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml/badge.svg)](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml)

EvidenceSpace is being designed as an online desktop workspace for organizing a case, connecting evidence on a visual board, collaborating with invited members, receiving source-backed AI assistance, producing reviewed reports, and finding a verified lawyer when professional help is needed.

## Repository status

This repository is **not yet the complete EvidenceSpace application**. `main` contains a substantial local-first browser prototype currently named **CaseFind**, focused on unpaid freelance payment disputes. That prototype already demonstrates valuable foundations: immutable original files, SHA-256 provenance, local PDF/image processing, source-linked facts and timeline events, review-only AI suggestions, deterministic conflict handling, encrypted backups, reports, and extensive browser lifecycle tests.

The accepted target product is broader and materially different:

| Area | Current implementation on `main` | EvidenceSpace target |
| --- | --- | --- |
| Client | Responsive browser prototype | Online Windows and macOS desktop application |
| Storage | Browser-local IndexedDB | Permissioned cloud workspace with encrypted local cache |
| Cases | Unpaid freelance payment disputes | Adaptive case workspace for individuals, professionals, investigators, and education |
| Core UI | Forms and document-oriented workspace | Case Home plus an interactive 2D evidence board |
| AI | File extraction suggestions | Persistent, source-backed case copilot with approval-gated actions |
| Collaboration | Not implemented | Realtime room, comments, presence, tasks, and shared case AI |
| Professional help | Not implemented | Premium verified lawyer discovery and booking |

Do not describe a target capability as implemented. The transition is recorded in [`docs/decisions/0001-evidencespace-target-product.md`](docs/decisions/0001-evidencespace-target-product.md).

## Start here

- [`HANDOFF.md`](HANDOFF.md) — complete product-conversation continuity, repository status, active blockers, next work, and takeover protocol for a new human or AI maintainer.
- [`AGENTS.md`](AGENTS.md) — repository-wide instructions for coding agents and contributors.
- [`docs/README.md`](docs/README.md) — canonical documentation map and precedence rules.
- [`docs/product/vision-and-principles.md`](docs/product/vision-and-principles.md) — product promise, audience adaptation, and trust principles.
- [`docs/product/information-architecture.md`](docs/product/information-architecture.md) — navigation and screen map.
- [`docs/product/page-specifications.md`](docs/product/page-specifications.md) — required contents and behavior of each page.
- [`docs/product/board-and-ai-copilot.md`](docs/product/board-and-ai-copilot.md) — board, evidence library, research, and AI interaction contract.
- [`docs/product/collaboration-and-lawyer-marketplace.md`](docs/product/collaboration-and-lawyer-marketplace.md) — collaboration and premium lawyer marketplace.
- [`docs/product/roadmap.md`](docs/product/roadmap.md) — sequenced V1 delivery and future plans.
- [`docs/product/marketing-site-later.md`](docs/product/marketing-site-later.md) — deferred promotional website brief, creative quality bar, and readiness gate.
- [`docs/engineering/target-architecture.md`](docs/engineering/target-architecture.md) — proposed production boundaries and architecture decisions still requiring spikes.
- [`docs/engineering/quality-standard.md`](docs/engineering/quality-standard.md) — quality pass and release gates.

## Existing prototype development

Requirements: Node.js 22–24 and Python 3 for the static preview command.

```bash
npm install
npm run sync:pdfjs
npm run check
npm run test:browser
npm run preview
```

`npm run sync:pdfjs` copies the version-pinned PDF.js runtime into `web/vendor/pdfjs`. Pull requests and pushes to `main` run dependency policy, workflow policy, typechecking, deterministic tests, generated-asset drift checks, and Playwright browser journeys.

## Product boundary

EvidenceSpace is designed to organize case material and provide source-backed assistance. AI must not impersonate a licensed lawyer, fabricate authority, authenticate evidence, silently decide disputed facts, or promise an outcome. Jurisdiction, source quality, uncertainty, contrary material, and the limits of automated analysis must remain visible. Formal representation exists only between a user and a licensed professional after the required engagement process.
