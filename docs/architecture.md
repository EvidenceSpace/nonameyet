# CaseFind architecture

## System shape

V1 is a responsive web application with a separate background processing worker.

- Web client: case creation, uploads, verification, timeline, and export preview.
- API: authorization, case state, signed uploads, retention, and export requests.
- PostgreSQL: structured case metadata, facts, events, conflicts, and audit records.
- Object storage: immutable originals and separately generated derivatives.
- Worker: malware checks, metadata extraction, OCR, classification, AI extraction, and export generation.

## Processing pipeline

1. Accept an authorized upload and assign a file identifier.
2. Store the immutable original and calculate SHA-256.
3. Generate a safe preview and extract metadata.
4. Run deterministic text extraction and duplicate detection.
5. Classify the document and request narrowly scoped structured AI extraction.
6. Validate the AI response against a versioned contract.
7. Save candidate facts and events as `suggested`.
8. Ask the user to confirm, correct, dismiss, or mark them uncertain.
9. Run cross-source gap and conflict analysis only after enough files are processed.

## Provenance rule

A fact or event cannot become user-confirmed unless it has at least one source reference or is explicitly marked as manually entered by the user. A source reference identifies the file plus a page, text range, timestamp, or image region when available.

## Suggested service boundaries

- `identity`: accounts, sessions, and case memberships.
- `cases`: parties, goals, checklist, and lifecycle.
- `files`: uploads, originals, derivatives, retention, and deletion.
- `extraction`: OCR and versioned AI contracts.
- `evidence`: candidate facts, events, source references, and conflicts.
- `exports`: preview, paid packets, manifests, and redacted copies.

## Cost controls

- Extract PDF text and OCR before using a vision model.
- Hash and compare files before processing duplicates.
- Send individual pages or image regions rather than entire cases when possible.
- Use a cheaper model for classification and a stronger model only for ambiguous cross-file reasoning.
- Cache extraction by file hash and contract version.

## Future collection modes

Possible later modes are WhatsApp exports, forwarded email, mobile share sheets, limited mailbox queries, and selected cloud folders. Full-device collection is not part of the planned V1 architecture.
