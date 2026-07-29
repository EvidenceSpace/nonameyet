# Source-linked manual timeline

CaseFind's first timeline is deliberately manual. It organizes dates the user has reviewed in an original record; it does not infer events, authenticate files, or claim that an event occurred.

## Stored event

Each event contains:

- a calendar date;
- a short title and optional description;
- the owning case ID;
- one original-record ID;
- the exact SHA-256 recorded for that source when the event was created;
- an explicit `user_entered` origin;
- local creation and update timestamps.

Event fields are validated before persistence. Dates must be real calendar dates, titles are limited to 120 characters, descriptions to 1,000 characters, and a source with a valid SHA-256 is required.

## Local lifecycle

IndexedDB schema version 5 adds an `events` store indexed by case and source record. Creating or removing an event updates the parent case activity timestamp, so an older encrypted backup becomes visibly stale.

A source record cannot be removed while a timeline event still references it. Permanent case deletion removes events in the same transaction as the case, files, facts, suggestions, and processing data.

## Backup and restore

Encrypted `.casefind` backups include timeline events. Restore validates event ownership, source existence, and the source hash before one atomic write. Backups created before timeline support remain restorable and materialize with an empty event collection.

## Reports

The export preflight includes a separate timeline control. Only timeline events whose source record still exists and whose stored SHA-256 still matches enter the self-contained report. Timeline content is escaped, original bytes are never embedded, and the report labels events as user-entered.

## Product boundaries

- CaseFind does not infer event dates.
- CaseFind does not authenticate a source or assert that an event happened.
- A source link is provenance, not proof of truth.
- Users should compare each event with the original record before sharing or relying on an export.

## Verification

Automated tests cover validation, chronological sorting, source hashes, encrypted backup round trips, older-backup compatibility, report inclusion, hostile content, and broken relationships.

The Chromium lifecycle covers manual creation, deterministic ordering, source-deletion protection, safe rendering, report preflight and output, backup staleness, event removal, atomic case deletion, mobile overflow, and zero external requests.
