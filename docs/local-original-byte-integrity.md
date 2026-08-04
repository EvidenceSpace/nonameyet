# Local original-byte integrity preflight

Before image OCR or PDF parsing begins, CaseFind now recomputes SHA-256 over the exact locally stored original bytes and compares it with the hash recorded when the file was explicitly added.

A mismatch or malformed recorded hash fails permanently before OCR, image decoding, PDF.js startup, extraction, or AI actions. The UI uses a safe `original_hash_mismatch` or `invalid_original_hash` failure without exposing runtime details. The local original is retained for manual review, and the user is asked to add a verified copy explicitly.

If Web Crypto hashing is unavailable or fails, processing stops with retryable `hash_unavailable`; CaseFind does not silently continue without provenance verification. PDF hashing participates in the existing cancellation deadline, and both pipelines check cancellation again after hashing. This closes the gap where valid magic bytes and file length could remain unchanged while the underlying local content no longer matched its recorded provenance.
