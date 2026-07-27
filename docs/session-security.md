# Session and CSRF boundary

CaseFind currently issues an anonymous server security session; this is not yet an account login. The boundary prevents cross-site analysis requests and scopes usage controls without uploading local case data.

- `GET /api/session` issues a random session in an `HttpOnly`, `SameSite=Strict` cookie and returns a separate CSRF token.
- `/api/analyze` requires a valid signed cookie, exact origin, CSRF token, and explicit analysis consent.
- Production requires `SESSION_SECRET` with at least 32 characters; local development uses an ephemeral secret.
- HTTPS origins add the `Secure` cookie flag.
- Analysis limits are keyed to the signed session rather than raw IP addresses.

Audit output is intentionally allowlisted. It contains event type, status, pseudonymous references, character count, and duration only. It never includes filenames, extracted text, quotes, candidate values, credentials, cookies, CSRF tokens, or full session identifiers.

A future account system can replace the anonymous session identity without weakening these boundaries.
