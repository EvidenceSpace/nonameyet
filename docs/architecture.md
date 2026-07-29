# CaseFind architecture

## Status and intent

This document separates the architecture that exists today from infrastructure that may be justified after beta validation. Describing a future service does not mean it is deployed or that users have consented to move local case data into it.

## Implemented local-first beta

The current product is a responsive static web application. The browser is the primary case workspace and system of record.

- **Browser application:** case creation, local file selection, processing, verification, timeline, consistency review, readiness, backup, restore, archive, deletion, and report generation.
- **IndexedDB:** `casefind-preview`, schema version 5, with `cases`, `files`, `facts`, `suggestions`, `processing`, and `events` stores.
- **Original records:** unchanged image and PDF bytes stored with the local file record and a SHA-256 digest.
- **PDF text:** extracted locally with the pinned PDF.js 4.10.38 browser runtime.
- **Image text:** local recognition is used only when the browser exposes the required capability; otherwise the product shows an explicit unavailable state.
- **Reports:** self-contained HTML generated locally. Original file bytes are not embedded.
- **Backups:** user-initiated encrypted `.casefind` bundles using AES-256-GCM and PBKDF2-HMAC-SHA-256.

There is no deployed PostgreSQL case store, object-storage evidence bucket, synchronization service, or background processing worker in the current local-first beta.

## Implemented optional account and analysis runtime

A same-origin server runtime exists for optional identity and AI analysis boundaries.

- OIDC account sessions are signed and protected against cross-site request forgery.
- Sign-in does not authorize file upload or case synchronization.
- `/api/analyze` accepts extracted text only after explicit analysis consent.
- Original image and PDF bytes are not accepted by the AI analysis boundary.
- Usage and idempotency records are encrypted, but the current storage design must be replaced with a multi-host transactional store before horizontal deployment.
- Provider credentials and spending controls must be intentionally configured before real paid-model traffic.

Cases, originals, facts, timeline events, checklist states, consistency decisions, and backups remain local by default even when an account exists.

## Local processing pipeline

1. Validate the selected MIME type, size, case limit, and duplicate hash.
2. Store the unchanged original locally with its SHA-256 digest.
3. Extract selectable PDF text locally or attempt explicitly supported local image recognition.
4. Preserve cancellation, work limits, and explicit processing failures.
5. If the user gives analysis consent, send extracted text—not original bytes—to the same-origin analysis endpoint.
6. Validate provider output against the versioned structured contract and source-quote requirements.
7. Store accepted output as a suggestion, never as a confirmed fact.
8. Require the user to confirm, correct, dismiss, or mark each suggestion uncertain.
9. Attach exact file ID, SHA-256, and available page, text, or image locator provenance.
10. Run deterministic comparison only for supported verified values from separate matching sources.

## Provenance invariants

- AI output is provisional until an explicit user decision.
- A verified fact or timeline event must resolve to an existing local source whose file ID and SHA-256 still match.
- A changed or missing source fails closed in readiness and report generation.
- Comparison decisions do not delete unselected values or determine which source is true.
- Reports exclude unresolved AI suggestions and original file bytes.
- Supported source differences and checklist gaps are disclosed rather than silently hidden.

## Current capability limits

- Scanned-PDF OCR is not yet universal.
- HEIC originals can be retained, but preview and text-recognition support vary by browser.
- Encrypted, malformed, corrupt, very large, and difficult photographic PDFs require broader fixture and device coverage.
- Browser data can be lost if site data is cleared before the user creates an encrypted backup.
- There is no automatic case synchronization, cloud recovery, paid plan, payment processing, or production support operation.

## Future production services—not current behavior

The following boundaries are candidates only after product validation and a separate consent design:

- **Identity:** account recovery, memberships, and production session operations.
- **Usage:** transactional multi-host quotas, billing events, and abuse controls.
- **Optional synchronization:** encrypted case state with explicit per-case enablement, default off.
- **Files:** optional encrypted object storage with explicit upload consent and retention controls.
- **Workers:** bounded OCR, malware inspection, derivative generation, and paid export jobs.
- **Exports:** paginated PDF, redacted copies, appendices, and source manifests.

Future synchronization must not be inferred from sign-in. Moving local case content to any remote destination requires a separate, visible user action and documented retention and deletion behavior.

## Postponed collection modes

WhatsApp exports, forwarded email, mobile share sheets, selected cloud folders, and limited mailbox queries may be researched later. Direct mailbox, messaging, call-log, background, or full-device collection remains outside V1 and requires separate demand evidence, permission design, threat modeling, and trust safeguards.

## Cost and scale rules

- Prefer deterministic local extraction before any AI call.
- Hash before processing duplicates.
- Send the minimum extracted text required for the requested analysis.
- Cache only where privacy and contract-version boundaries are explicit.
- Select models from measured accuracy, provenance quality, latency, and cost—not marketing claims.
- Do not add distributed infrastructure before the local workflow and willingness to pay are validated.
