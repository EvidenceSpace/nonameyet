# CaseFind

[![Quality](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml/badge.svg)](https://github.com/EvidenceSpace/nonameyet/actions/workflows/quality.yml)

CaseFind helps freelancers organize client messages, invoices, delivery proof, and payment records into a user-verified, source-linked case record.

## Product status

CaseFind is a local-first beta implementation focused on unpaid freelance work. Users explicitly create cases and choose files. Full-device, mailbox, messaging, and background collection are outside V1.

## Implemented foundations

- Local case creation, editing, archiving, library search, backup, restore, and permanent deletion.
- Local image and PDF processing with exact SHA-256 provenance.
- AI suggestions remain review-only until the user confirms or corrects them.
- Manual source-linked timeline events with optional PDF pages and excerpts.
- Deterministic source-consistency review for narrowly comparable verified values.
- Transparent organization readiness that does not predict legal outcomes.
- Self-contained report preview and download with unresolved content excluded.
- Optional accounts that do not synchronize cases or grant upload permission.

## Product boundaries

- CaseFind organizes user-provided material; it does not provide legal advice.
- It does not authenticate files, decide who is correct, or predict outcomes.
- Original image and PDF bytes are not sent to AI providers.
- Extracted text crosses the AI boundary only after explicit user consent.
- Cases and original bytes stay in browser storage unless a user explicitly creates an encrypted backup.

## Development

Requirements: Node.js 22–24 and Python 3 for the static preview command.

```bash
npm install
npm run sync:pdfjs
npm run check
npm run preview
```

`npm run sync:pdfjs` copies the version-pinned PDF.js runtime into `web/vendor/pdfjs`. Pull requests and pushes to `main` run typechecking, automated tests, and a generated-asset drift check in GitHub Actions.

Product and trust decisions live in [`docs/`](docs/). Engineering rules live in [`AGENTS.md`](AGENTS.md).
