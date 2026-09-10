# CaseFind trust invariants and the Evidence read boundary

**Status:** current repository evidence, 2026-09-10  
**Scope:** one read-only C-03/E-04 seam; no migration or write claim

## Why this boundary exists

EvidenceSpace is changing its presentation layer without weakening the behavior
already proven in CaseFind. The connected UI must not treat a convenient object
shape as proof that an original, extraction, statement, or review decision is
current.

The first seam therefore reads one source snapshot through a narrow provider,
validates its identities, and returns an immutable display record. It never
receives original bytes and exposes no write operation.

## Current invariants

### 1. The original has one stable identity

A stored source is identified by `file.id`, `file.caseId`, and a 64-character
SHA-256. Its stored original metadata must still match name, media type, and
size. Byte verification remains an upstream operation performed by
`assertOriginalBytesMatchHash`; the display adapter does not claim that a
recorded checksum was re-computed.

Evidence: `web/original-byte-integrity.js`, `src/processing/integrity.ts`,
`web/storage.js`, and their focused tests.

### 2. Derived processing stays bound to that original

A processing record is usable only when `fileId`, `caseId`, and `fileHash` match
the current source. A ready extraction must also pass artifact validation before
upstream code trusts it. Identity drift is a stale state, not an invitation to
show cached derived text.

Evidence: `web/processing-integrity.js`, `web/extraction-artifact.js`,
`src/processing/types.ts`, and processing-integrity tests.

### 3. Every statement keeps its source link

Facts, suggestions, and timeline events carry both a source-file identifier and
a `sourceReference` containing the source hash and locator. Missing sources and
hash mismatches fail closed. Contrary material must remain contrary; adaptation
must not flatten it into supporting evidence.

Evidence: `web/storage.js`, `web/review-transition.js`,
`web/timeline-model.js`, and source-linked/timeline tests.

### 4. A person makes review decisions

AI suggestions are not facts. A confirmation or correction requires an explicit
person decision, keeps source identity, and atomically replaces the reviewed
suggestion. Uncertain and dismissed dispositions are explicit. The connected
read-only seam does not expose those mutations yet.

Evidence: `web/review-transition.js` and review-transition tests.

### 5. Stale screens cannot win

Source-linked writes compare the rendered or expected snapshot with the current
stored value inside the same transaction. Changed sources, suggestions, facts,
and files abort without a partial update. Processing replacement uses a
compare-and-swap check.

Evidence: `web/storage.js`, `web/review-transition.js`, and concurrency/removal
coverage.

### 6. Deletion respects dependencies

A source cannot be removed while facts, suggestions, or timeline events still
link to it. Successful removal also clears its processing record and updates the
case activity timestamp atomically. Case deletion removes the case-owned stores
in one transaction.

Evidence: `web/storage.js` and file/fact/source removal tests.

### 7. Recovery never overwrites silently

Storage-open and processing failures say that nothing changed. Restore refuses
to overwrite an existing case and writes a bundle transactionally. A later
missing or deleted read must replace an older ready display state rather than
reusing it.

Evidence: `web/storage-recovery-model.js`, `web/processing-run-recovery.js`,
`web/storage.js`, and restore/recovery tests.

### 8. Access failure never falls back to demo content

Synthetic C-03/E-04 data is allowed only when no provider is installed. Once a
provider participates, `denied`, `missing`, `deleted`, `stale`, `changed`, and
`error` all return without a record. Malformed provider output also fails
closed. This prevents a real-source failure from being disguised as a plausible
demo record.

Evidence: `web/evidencespace-pages/evidence-record-adapter.js` and its unit and
browser coverage.

## Read-only provider contract

A host may expose `readEvidenceRecord({ caseId, evidenceId })` through
`globalThis.__evidenceSpaceEvidenceProvider`.

The provider returns either:

- `{ status: "ready", snapshot }`; or
- `{ status: "denied" | "missing" | "deleted" | "stale" | "changed" | "error" }`.

A ready snapshot contains a CaseFind-shaped file identity, optional matching
processing identity, source-linked facts/suggestions, and bounded display
metadata. The adapter returns a deeply frozen record without the original Blob
or File.

| State | Connected UI behavior |
| --- | --- |
| `ready` | Render the immutable source as read-only. |
| `denied` | Show no source title, preview, or statements. |
| `missing` / `deleted` | Show no older or synthetic replacement. |
| `stale` | Hide derived material until processing identity is current. |
| `changed` | Hide the record until source links and identity are reviewed. |
| `error` | Say nothing changed and allow a later fresh read. |

The adapter has no cache. That is intentional: recovery and rollback always use
the provider’s latest result.

## What this slice proves

- One C-03/E-04 source snapshot can enter Evidence and Context Lens through a
  storage-independent read contract.
- Matching source, processing, fact, and suggestion identities are checked
  before display.
- Contrary material survives adaptation.
- Provider failures do not reveal or substitute the synthetic source.
- Real-provider records are read-only; the existing session-only review preview
  remains available only for the synthetic fallback.

## What it does not prove

- that a production provider, backend, or authorization service exists;
- that original bytes were re-hashed by the connected UI;
- that legacy IndexedDB data has been migrated;
- that review, correction, deletion, upload, or collaboration writes are ready;
- that concurrency, revocation, network recovery, or packaged desktop behavior
  has been tested through the new shell.

## Next implementation step

Build a dedicated CaseFind read provider that reads the existing stores without
upgrading or mutating them, maps stable file IDs to EvidenceSpace object IDs,
and supplies authorization-aware states. Test it against temporary IndexedDB
fixtures before exposing any real case record. Keep all writes outside the
connected shell until the same compare-and-swap and atomicity guarantees are
proven at this boundary.
