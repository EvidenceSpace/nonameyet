# Local document processing pipeline

This pipeline turns an immutable uploaded file into normalized text that can be
handed to the hardened AI extraction layer. It does not call an AI provider and
does not upload file bytes.

## Lifecycle

Each file has a versioned processing job with one of these states:

1. `queued`
2. `extracting`
3. One terminal or waiting state:
   - `ready_for_ai` — normalized text and provenance are available.
   - `needs_ocr` — the selected adapter found no usable text layer.
   - `retry_wait` — a temporary adapter failure can be retried.
   - `failed` — a permanent error or exhausted retry budget.
   - `cancelled` — the user or caller stopped processing.

Transitions are allowlisted. A caller cannot run a job that is not queued or
skip directly from queued to ready.

## Adapter boundary

Adapters declare which file descriptors they support and return either:

- Page-numbered text, or
- An explicit `needs_ocr` result.

The adapter receives the file descriptor and an optional abort signal. It cannot
change the original file, hash, or job identity. Concrete PDF and OCR engines can
be added behind this interface without changing queue or AI-verification rules.

## Normalization

Before any text can reach AI, CaseFind:

- Normalizes Unicode to NFKC.
- Normalizes line endings.
- Removes non-printing control characters while retaining tabs and newlines.
- Sorts pages by page number.
- Rejects duplicate, zero, negative, or non-integer page numbers.
- Records exact character offsets for every page.
- Rejects empty output.
- Rejects output above 500,000 characters by default.

The resulting artifact carries the file ID, original SHA-256 hash, adapter ID,
adapter version, pipeline version, extraction timestamp, warnings, page offsets,
and normalized text.

## Integrity rules

- A job is bound to a file ID and SHA-256 hash. If either changes, processing
  fails closed as `corrupt_file`.
- Accidental duplicate jobs for the same file, hash, and pipeline version are
  removed before queue execution.
- At most four workers may run concurrently; the default is two.
- Queue results retain input order even when workers complete out of order.

## Retry behavior

Only failures marked retryable enter `retry_wait`. Backoff begins at one second,
doubles per attempt, and is capped at 30 seconds. Jobs default to three attempts.
Permanent failures such as unsupported types, corrupt page output, empty output,
and excessive output are not retried automatically.

## AI handoff

`prepareAiHandoff` is the only boundary from local processing into the AI layer.
It requires a `ready_for_ai` job with an artifact whose file ID and hash still
match the job. It then uses the existing untrusted-content wrapper to:

- Strip forged document delimiters from filenames and text.
- Keep the exact sanitized text used for later quote grounding.
- Include adapter and pipeline versions in the handoff.
- Preserve the file ID and SHA-256 hash.

A prepared handoff is still not a confirmed fact. It can only produce suggestions
through the separate extraction contract and verification gate.

## Deliberately not included

- No provider credentials.
- No network request.
- No cloud file storage.
- No bundled PDF parser or OCR engine yet.
- No background processing that continues after the browser closes.

Those capabilities should be added as concrete adapters, preserving this state
machine and provenance contract.
