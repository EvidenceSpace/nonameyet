# Durable analysis usage and idempotency

The executable server stores quota reservations and successful idempotent analysis responses in SQLite. The default database is `.casefind/analysis-usage.sqlite`; set `USAGE_DB_PATH` to use a mounted production volume.

## Privacy and integrity

- Session and request identifiers are HMAC-pseudonymized before storage.
- Successful response payloads are encrypted with AES-256-GCM using a key derived from `SESSION_SECRET`.
- Extracted page text, filenames, cookies, CSRF tokens, credentials, and raw session identifiers are never written to quota tables.
- SQLite transactions use `BEGIN IMMEDIATE` so concurrent processes sharing one database cannot overspend the same quota window.
- Failed provider responses are not cached.
- Expired usage and idempotency records are removed during normal requests.

Security sessions are stateless signed cookies. With a stable production `SESSION_SECRET`, the same cookie and CSRF token remain valid after a restart, allowing durable quotas and idempotency to remain tied to the same anonymous session.

SQLite is appropriate for a single host with a durable mounted volume. Multi-host deployment will require a transactional shared store while preserving the `AnalysisUsageStore` interface.
