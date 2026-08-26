# Collaboration and lawyer marketplace

## Collaboration principles

- Access is case-scoped and least-privileged.
- Visibility is explicit: private, selected members, case members, or workspace.
- Realtime convenience never overrides auditability or conflict safety.
- AI summaries and conversions preserve links to source messages.
- Private conversations do not become shared memory automatically.

## Roles

| Capability | Owner | Admin | Editor | Reviewer | Guest |
| --- | --- | --- | --- | --- | --- |
| View authorized case content | Yes | Yes | Yes | Yes | Limited |
| Add evidence and board objects | Yes | Yes | Yes | No by default | No |
| Edit accepted case structure | Yes | Yes | Yes | Suggest/comment | No |
| Use shared Case AI | Yes | Yes | Yes | Yes | Optional |
| Approve ordinary AI proposals | Yes | Yes | Yes | Review only | No |
| Invite/manage members | Yes | Yes | No | No | No |
| Change retention/delete case | Yes | Policy-dependent | No | No | No |
| Share with a lawyer | Yes | Permission-dependent | Propose | Propose | No |
| Manage billing | Yes/workspace billing role | Optional | No | No | No |

Exact permissions are stored and enforced server-side. UI hiding is not authorization.

## Room structure

### Channels/topics

V1 defaults:

- General;
- Evidence;
- Research;
- Tasks; and
- Shared Case AI.

Users with permission may create additional topics. Direct messages are outside the official case record unless deliberately published.

### Message capabilities

- text and accessible formatting;
- threads and replies;
- mentions and reactions;
- pin/bookmark;
- evidence, research, task, report, and board deep links;
- file attachment through the normal evidence intake boundary;
- edit and deletion history according to policy;
- unread marker and search;
- typing/presence without retaining unnecessary behavioral telemetry; and
- draft recovery.

### Convert actions

A member can preview conversion of a message into:

- task;
- sticky note;
- evidence candidate;
- research question;
- decision;
- open question; or
- report note.

The created object retains a message reference, author, timestamp, visibility, and conversion actor. Deleting a message does not silently erase an accepted downstream object; the link becomes unavailable and the audit trail records the change.

### AI in Room

- Summarize unread discussion with links to messages.
- Extract proposed decisions and tasks, never auto-accept them.
- Answer from authorized case and thread context.
- Flag contradictory statements as discussion differences, not factual conclusions.
- Draft status updates and meeting agendas.

## Collaboration states and recovery

Required states include invitation pending/expired/revoked, member removed, role changed, read-only, reconnecting, divergent offline cache, duplicate send, failed upload, edited/deleted message, and case archived/deleted.

Realtime operations require stable IDs, idempotency, revision/version checks, deterministic merge rules, and an audit event. A reconnect cannot resurrect deleted or access-revoked content.

## Notifications

Members can control routine notifications by case and category. Security, access, retention, and billing-critical notices follow policy. Desktop notification previews never expose case title or content on a locked device unless the user explicitly enables detailed previews.

# Premium Find a Lawyer

## Marketplace purpose

Help a user discover, compare, and book an appropriate licensed professional while keeping selection, sharing, and engagement decisions under user control.

Premium grants access to the in-product discovery and booking workflow. The lawyer’s service price is separate from the EvidenceSpace subscription.

## Lawyer onboarding and verification

A professional profile cannot appear as verified until required checks are complete. The data model supports:

- legal name and public professional name;
- identity verification status;
- bar/license identifier;
- issuing jurisdiction;
- active/inactive/restricted/unknown status;
- original and latest verification dates;
- practice areas and claimed experience;
- languages;
- professional address and remote/in-person modes;
- professional insurance where relevant and lawful;
- disciplinary disclosure workflow where required;
- payout and tax onboarding;
- marketplace terms acceptance; and
- periodic re-verification.

Verification requirements vary by jurisdiction and require legal/operational review. “Verified” always states what was checked and when.

## Lawyer profile

Required user-facing sections:

- identity and verification badge/details;
- description and approach;
- licensed jurisdictions;
- practice areas;
- languages;
- years of experience with careful sourcing;
- consultation services, durations, prices, and next availability;
- remote/in-person mode and time zone;
- average response time based on disclosed calculation;
- verified booking rating and review count;
- cancellation/refund policy;
- sponsored/promoted disclosure; and
- report profile.

## Search and ranking

### Filters

Jurisdiction, practice area, case type, language, remote/in-person, availability, price, experience, and verified rating.

### Ranking principles

- License and jurisdiction eligibility are hard filters when required.
- Relevance factors are documented internally and monitored for unfair exclusion.
- Paid placement never masquerades as organic relevance.
- AI can recommend search criteria based on a case, but must explain them and let the user change them.
- A high rating is not a guarantee of outcome.
- New qualified professionals need a fair path to discovery.

## Booking lifecycle

States:

1. `draft`;
2. `conflict_screening`;
3. `requested`;
4. `awaiting_lawyer`;
5. `accepted`;
6. `payment_pending`;
7. `confirmed`;
8. `reschedule_requested`;
9. `cancelled`;
10. `refunded`;
11. `completed`;
12. `disputed`; and
13. `no_show`.

Transitions are permissioned, idempotent, auditable, and payment-aware. Time-slot reservation and payment capture must avoid double booking and double charge.

## Conflict screening and limited intake

Before case content is shared, collect the minimum information needed for the lawyer to identify conflicts. The user sees which fields are visible to the lawyer and why. Rejection for a conflict must not reveal another client’s identity.

## Selective case sharing

The user builds a consultation package from:

- a reviewed case summary;
- selected evidence;
- selected board frames;
- timeline range;
- issue matrix;
- research sources;
- open questions; and
- requested consultation outcome.

Before sharing, show recipient, exact objects, derivative/redacted status, access duration, download permission, and revocation limitations. The full workspace is never included by default.

A lawyer receives a separate, scoped consultation membership. Access expires or changes only according to the disclosed engagement state and retention policy.

## Payment and subscription boundaries

- Premium entitlement and consultation purchase are distinct ledger entries.
- Price, currency, taxes, platform fee, lawyer amount, cancellation, refund, and dispute terms are visible before payment.
- No card or bank credentials enter application logs.
- Webhooks are verified, idempotent, replay-safe, and reconciled.
- Booking is not confirmed solely from a client-side success screen.

Payment provider selection is a Decision required and must account for marketplace payouts in supported jurisdictions.

## Reviews

- Only completed verified bookings can create a review.
- One review per booking, with edit history and moderation state.
- The lawyer may respond.
- Users and lawyers may report abuse.
- Moderation preserves criticism unless it violates published policy.
- Incentivized reviews are prohibited or clearly disclosed where lawful.
- Ratings display count and methodology; no fabricated testimonials.

## Consultation versus representation

The product must distinguish:

- **Marketplace introduction:** viewing or contacting a profile.
- **Consultation:** a booked limited service.
- **Engagement offered:** lawyer proposes further work.
- **Formal representation:** separate signed agreement between user and lawyer.

EvidenceSpace must not imply that marketplace use itself creates an attorney-client relationship or that EvidenceSpace is the law firm.

## Marketplace operations

V1 requires internal operational tools for:

- professional application and verification queue;
- license re-checks;
- profile moderation;
- availability and booking support;
- refunds, cancellations, and disputes;
- review moderation;
- fraud and abuse investigation;
- user privacy requests;
- data retention/deletion; and
- incident escalation.

A marketplace cannot safely launch with only customer-facing screens.

## Staged V1 delivery

### Stage A — Curated directory and consultation requests

Verified profiles, search/filter, availability display, saved profiles, limited intake, selective package preview, request status, and verified-review foundation. Operations may confirm edge cases manually.

### Stage B — Transactional booking

Live slot reservation, payment, cancellation, refunds, marketplace messaging, webhooks, reconciliation, and operational dashboards.

### Stage C — Consultation space

Scoped consultation membership, secure messaging, package versioning, follow-up, and formal engagement handoff. Native calls remain Future.

## Safety and access

AI may always recommend seeking qualified help. Essential crisis, emergency, or public legal-aid information must not be withheld merely because the user lacks Premium. Premium controls the in-product marketplace experience, not access to truthful safety guidance.