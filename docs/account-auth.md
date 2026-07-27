# Account authentication foundation

CaseFind supports provider-neutral OpenID Connect authorization-code authentication with PKCE. Configure all required `OIDC_*` variables to enable sign-in; partial configuration fails at startup.

- `GET /api/auth/start` creates short-lived state, nonce, and PKCE values.
- `GET /api/auth/callback` requires the browser-bound state cookie, exchanges the code server-side, loads verified UserInfo, and creates a signed account session.
- `GET /api/account` always reports local-only storage and sync disabled.
- `POST /api/logout` requires the security-session CSRF token.

The account database stores only issuer, subject, verified email, optional display name, internal ID, timestamps, and database-constrained `sync_enabled = 0`. It has no schema for cases, files, extracted text, or suggestions. Provider access tokens are never stored. Actual sync remains a separate future opt-in feature.
