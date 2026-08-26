# Security, privacy, AI, and legal-source governance

## Scope

This is the target security and governance baseline for the online desktop application. The current prototype’s local-first controls remain documented separately. No document alone proves security; each control requires implementation, tests, operations, and review.

## Data classification

### Restricted case content

Original evidence, derivatives, extracted text, transcripts, board content, case facts, messages, AI prompts/responses, research notes, consultation intake, conflict-screening information, and report drafts.

### Sensitive account/business data

Identity, contact details, memberships, billing, lawyer license records, payout/tax references, support cases, and security events.

### Operational metadata

Object IDs, timestamps, safe operation types, latency, size buckets, status/error categories, and aggregate usage that cannot reconstruct case content.

Restricted content is excluded from general logs, analytics, traces, crash reports, notifications, and test artifacts.

## Threat model areas

- cross-workspace/case authorization bypass;
- insecure object keys or signed URL leakage;
- desktop renderer/native bridge compromise;
- malicious files and parser vulnerabilities;
- prompt injection and data exfiltration through tools;
- model hallucination or citation mismatch;
- realtime replay, stale permissions, and object resurrection;
- unauthorized shared/private memory transfer;
- incomplete deletion or retained embeddings/indexes;
- report/redaction reversal;
- lawyer impersonation, license drift, fake reviews, and conflicts;
- booking/payment fraud, webhook replay, double charge/booking;
- supply-chain, update, CI, and secret compromise; and
- insider/support access to sensitive material.

Maintain a living threat model per vertical slice and before private beta.

## Authorization

- Default deny.
- Enforce workspace, case, object visibility, role, and action server-side.
- Reauthorize downloads, exports, realtime subscription, AI retrieval, report generation, and lawyer sharing.
- Short-lived access tokens/URLs are object and operation scoped.
- Role changes and revocation propagate to active sessions and realtime channels.
- Administrative/support access requires approved purpose, least privilege, audit, and expiration.
- Tests include cross-tenant IDs, guessed keys, stale sessions, revoked members, shared links, and consultation access expiry.

## Authentication and sessions

- Standards-based identity with protected authorization code flow.
- Secure, HttpOnly, SameSite cookies or equally reviewed desktop token model.
- OS keychain/credential store for refresh secrets.
- CSRF protection where cookies authorize writes.
- Session list, device visibility, revocation, rotation, inactivity/absolute expiry, and suspicious-login handling.
- Multi-factor support before professional/operations launch; stronger requirements for marketplace administrators and lawyer accounts.

## Encryption and keys

- TLS in transit.
- Managed encryption at rest for databases, object storage, backups, and queues.
- Application-level envelope encryption considered for especially sensitive fields and local cache.
- Separate keys by environment; rotation and revocation tested.
- Secrets managed outside code and logs.
- Backups encrypted and restore tested; encryption without restore evidence is insufficient.

Do not claim end-to-end encryption while server AI, search, previews, or collaboration require plaintext processing.

## Evidence upload and processing

- Explicit user selection in V1; no background device monitoring.
- Validate authorization, size, declared/detected type, signatures, decompression bounds, media dimensions/duration, and hash.
- Quarantine until required checks complete.
- Treat parsers, OCR, transcription, archives, images, PDFs, and media as hostile.
- Bound CPU, memory, pages, duration, text output, retries, and processing time.
- Sandboxing/isolation for risky processing where supported.
- Preserve original, store derivatives separately, and record tool/version/warnings.
- Cancel pending work and access when evidence or case is deleted.

## Prompt injection and AI tool safety

- Source text is data, never instructions.
- Separate trusted instructions, user request, retrieved context, and quoted untrusted content structurally.
- Strip/escape forged delimiters and detect instruction-like content without obeying it.
- Retrieved documents cannot change permissions, tool allowlists, recipients, billing, or approval rules.
- The model proposes structured actions; a policy/authorization layer validates and executes them.
- Tool arguments are schema validated, scoped, size bounded, and idempotent where retried.
- External sharing, payments, booking, deletion, filing, and messages require dedicated confirmation.
- No full-case model request when a scoped subset suffices.
- Provider data retention, region, subprocessors, training policy, and deletion terms are documented per workload.

## Grounding and citation governance

A material AI claim is usable only when:

- case claims point to reachable evidence locators or are labeled user-provided/general hypothesis;
- legal claims point to captured authority with jurisdiction and date;
- quotes match the exact retrieved/saved version;
- the source version remains available to authorized users;
- contrary sources and applicability limits are not suppressed; and
- stale or superseded sources are disclosed.

Citation verification runs after model generation. Invalid citations fail closed or cause the claim to be rewritten without unsupported certainty.

## Legal source governance

Maintain a source registry containing:

- source/provider;
- jurisdictions and authority types covered;
- update frequency and latest successful update;
- license/redistribution constraints;
- retrieval and archive behavior;
- known gaps; and
- quality incidents.

Primary/official authority is preferred. The product displays “current as of” based on source retrieval/update evidence, not model training claims.

Jurisdiction selection is user-confirmed when material. Unsupported or partially supported jurisdictions remain usable for organization, but legal analysis clearly states coverage limits.

## AI output and action states

- `proposed` is visibly different from accepted case content.
- User correction preserves original suggestion, source, and actor.
- AI never marks its own output professional-reviewed.
- Model confidence is not legal certainty or evidence strength.
- The system records model, prompt, retrieval, contract, and tool versions needed for audit/evaluation without placing private text in general logs.
- Undo creates a new auditable operation; it does not erase history.

## Memory and visibility

- Shared Case AI and private AI are separate scopes.
- Summaries inherit the strictest visibility of included content unless the user publishes a reviewed version.
- Memory entries show source, visibility, editor, and delete path.
- Access revocation removes future retrieval and invalidates local cache.
- Cross-case memory is off by default and requires explicit product scope and authorization.

## Realtime security

- Authenticate connection and authorize each subscription.
- Recheck on reconnect and relevant role changes.
- Protect against replay, event reordering, duplicate application, oversized payloads, and subscription enumeration.
- Channel/topic names contain opaque IDs, not case titles.
- Presence is ephemeral and minimal.

## Reports and redaction

- Generate from a versioned, permission-checked manifest.
- Reauthorize at export/download.
- Redaction creates a derivative; never paint over text while leaving it extractable.
- Inspect generated PDFs/documents for metadata, hidden layers, annotations, attachments, and reversible content.
- Disclose AI-generated, disputed, stale, omitted, and unverified sections.

## Lawyer marketplace governance

### Verification

- Identity and license checks with date, source, jurisdiction, and status.
- Periodic re-check and prompt suspension/review for changed status.
- Clear scope of the “verified” badge.
- Operations access separated from ordinary support.

### Conflict and confidentiality

- Collect minimum conflict-screening data.
- A conflict rejection never exposes another client.
- No case content shared before recipient/package preview and consent.
- Consultation membership is scoped, expiring, and revocable subject to disclosed professional obligations.

### Reviews and ranking

- Reviews require completed bookings.
- Moderation and appeal process.
- Sponsored placement labeled.
- Ranking factors monitored and documented; no outcome-based promises.

### Relationship clarity

Marketplace introduction, consultation, engagement offer, and formal representation are distinct. Terms and UI must pass jurisdiction-specific legal review before launch.

## Payments

- Use provider-hosted payment entry where practical.
- Verify webhook signatures, timestamps, event IDs, and environment.
- Idempotent processing and replay protection.
- Server-side amount/currency/service validation.
- Separate subscription and consultation ledgers.
- Reconciliation, refunds, disputes, payout holds, and audit.
- Never log payment credentials or sensitive provider payloads unnecessarily.

## Retention, deletion, and legal hold

Users see retention and deletion effects before action. A case purge covers:

- primary metadata;
- original versions;
- derivatives/previews/redactions;
- extracted text/transcripts;
- search indexes and embeddings;
- AI memory and protected prompt records;
- board snapshots and operations according to policy;
- messages/comments;
- reports/exports;
- queued jobs and caches;
- signed links; and
- backups according to disclosed cycle.

Marketplace/payment/legal records may have statutory retention obligations. Separate them from case content and state exceptions clearly. Legal-hold capability, if introduced, requires explicit authority, visibility, and audit.

## Privacy-safe analytics and observability

Allowed examples:

- operation category;
- success/failure and safe error code;
- latency and resource metrics;
- object count/size bucket;
- source/citation validity outcome;
- approval/rejection/undo outcome; and
- client/app version.

Prohibited in general telemetry:

- case titles/summaries;
- filenames;
- extracted text or quotes;
- message/comment bodies;
- prompts/responses;
- search queries containing case content;
- lawyer conflict details;
- signed URLs, tokens, or secrets.

## Security verification

Before private beta:

- architecture and threat-model review;
- static/dependency/secret scanning;
- authorization matrix tests and cross-tenant penetration tests;
- desktop bridge/CSP/update review;
- malicious file/parser tests;
- prompt-injection and tool-exfiltration red-team;
- citation and legal-source freshness evaluations;
- redaction inspection;
- deletion and backup/restore exercises;
- payment/booking replay and concurrency tests;
- incident response and support-access drill; and
- independent penetration test for production scope.

Any unverified control is labeled planned, not claimed as secure behavior.