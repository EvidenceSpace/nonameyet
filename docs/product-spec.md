# CaseFind V1 product specification

## Product promise

CaseFind helps a freelancer organize user-selected client records into a source-linked case record. It can surface candidate information for review, but the user remains responsible for confirming every included fact and event.

## Initial user

A freelancer or small service provider with unpaid work whose records are distributed across screenshots, invoices, proposals, receipts, PDFs, and delivery messages.

## Delivery states

- **Implemented:** available in the current local-first beta.
- **Partial:** the workflow exists but real-document, browser, device, or provider coverage remains incomplete.
- **Planned:** intentionally not represented as a current capability.

## V1 user journey

1. **Implemented:** create and edit an unpaid-work case with a desired outcome.
2. **Implemented:** review six collection categories as Found, Missing, Needs review, or Not applicable.
3. **Implemented:** explicitly select supported images and PDFs, up to 100 files and 20 MB each.
4. **Partial:** extract selectable PDF text and supported local image text; universal offline OCR and scanned-PDF OCR remain planned.
5. **Implemented:** confirm, correct, dismiss, or mark grounded AI suggestions uncertain.
6. **Implemented:** review deterministic differences for supported verified price and date values from separate sources.
7. **Implemented:** create and edit a chronological timeline linked to exact local sources.
8. **Implemented:** preview and download a self-contained verified HTML report.
9. **Planned:** purchase a premium paginated export after beta value and willingness to pay are validated.

## Case workspace

- **Overview — implemented:** user-entered amount, local record counts, checklist progress, and organization readiness.
- **Checklist — implemented:** explicit found, missing, needs-review, and not-applicable states.
- **Files — partial:** immutable local originals, SHA-256, preview where supported, and processing state. Universal OCR and all-format previews are not complete.
- **Facts — implemented:** user-entered, confirmed, or corrected values with exact source provenance.
- **Timeline — implemented:** user-editable events with source file, hash, and optional locator.
- **Source consistency — partial:** deterministic review for agreed price, payment deadline, and delivery date. General contradiction reasoning is planned.
- **Reports — implemented:** verified facts, valid events, source ledger, supported source differences, and all checklist states with explicit export controls.

## File support and honest limitations

- PNG and JPEG originals are accepted.
- HEIC originals are accepted, but preview and recognition support vary by browser.
- PDFs with selectable text are processed locally through pinned PDF.js assets.
- Scanned-PDF OCR is not yet universal.
- Encrypted, malformed, corrupt, oversized, rotated, low-resolution, and mixed-language documents need broader fixture and device validation.
- Original bytes remain local and are never sent to an AI provider.

## Data and account behavior

- Cases and original records are account-free and local by default.
- Signing in does not upload or synchronize a case.
- Extracted text may cross the AI boundary only after explicit analysis consent.
- Encrypted backup and atomic restore are implemented; automatic cloud recovery is not.
- Any future synchronization must be separately enabled and default off.

## Required trust language

CaseFind organizes user-provided material. It does not authenticate files, determine legal rights, decide who is correct, provide legal advice, or predict outcomes.

Checklist states, readiness scores, AI suggestions, and source comparisons are organization and review aids—not findings about authenticity, evidentiary weight, fault, or likely success.

## Explicitly excluded from V1

- Full-device access or background monitoring.
- Direct SMS, call-log, WhatsApp, mailbox, or cloud-folder access.
- Automatic case synchronization.
- Court filing and jurisdiction-specific legal advice.
- Screenshot-authenticity or forensic-certification claims.
- Family, custody, criminal, or emergency workflows.
- Audio and video analysis.

## V1 success criteria

- Users can locate the exact source of every confirmed fact and timeline event.
- Users understand extracted, suggested, confirmed, corrected, missing, and unresolved states.
- Supported source differences and collection gaps are not silently hidden.
- A complete local case can be backed up, restored, archived, and permanently deleted without support intervention.
- Beta users finish a trustworthy record faster than producing the same result manually.
- Users understand what stays local and what crosses the optional AI boundary.
- Some beta users are willing to pay for a polished export after seeing the complete preview.

## Release gates before paid V1

- Version-pinned universal offline OCR and scanned-PDF coverage, or an explicit narrower support promise backed by fixture results.
- A representative private or synthetic AI evaluation corpus with accuracy, grounding, injection-resistance, latency, and cost measurements.
- Continuous browser lifecycle coverage for creation, processing, verification, consistency review, backup, restore, deletion, and export.
- Production deployment, secrets, monitoring without private-content leakage, incident response, support, privacy terms, and payment handling.
- Controlled beta evidence for completion, abandonment, trust comprehension, report value, and willingness to pay.
