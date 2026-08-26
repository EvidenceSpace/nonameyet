# EvidenceSpace domain model

## Modeling rules

- Domain objects are independent of board rendering.
- Original sources and derived objects are different records.
- Accepted facts, AI findings, and visual notes are never conflated.
- Every protected object carries workspace/case ownership or derives it through a constrained relationship.
- State transitions are allowlisted, authorized, version-checked, idempotent where retried, and audited.
- Timestamps use UTC instants plus explicit source/local time zone when legal meaning depends on it.
- Soft delete is not permanent deletion; retention and purge states are explicit.

## Identity and workspace

### User

`id`, profile, language, time zone, terminology preference, accessibility preferences, notification policy, account status, created/updated timestamps.

### Workspace

`id`, name, owner, plan/entitlements, default retention, policy, status, created/updated timestamps.

### WorkspaceMembership

User, workspace, role, invitation/active/suspended/revoked state, permissions, inviter, timestamps.

### Session and DeviceRegistration

Revocable session/device metadata with safe display name, platform, last seen, notification token reference, and security events. Never store raw secrets in general records.

## Case

### Case

`id`, workspace, title, private label, summary, objective, case classification, jurisdiction set, stage/status, owner, retention policy, archive/deletion state, created/updated/last-activity timestamps, revision.

Recommended statuses:

- `draft`;
- `active`;
- `on_hold`;
- `reviewing`;
- `closed`;
- `archived`;
- `pending_deletion`; and
- `purged` represented only in deletion ledger, not normal reads.

### CaseJurisdiction

Country, state/region, court/authority where known, governing/incident/filing role, user-confirmed or suggested status, source, effective dates.

### CaseMembership

User, case, role, object restrictions if supported, joined/revoked timestamps, inviter, consultation membership flag, expiry.

### CaseClassification

Matter family and subtype with `suggested`, `confirmed`, `changed`, or `unknown` status. Multiple issue tracks may span civil, criminal, administrative, family, or educational categories.

## Evidence and provenance

### EvidenceItem

Stable logical item: case, title, evidence type, collection method, owner/uploader, source description, captured/received dates, status, sensitivity/visibility, tags, current original version, retention, revision.

Evidence type may be document, image, video, audio, message export, webpage capture, manual statement, physical-item record, or other.

### EvidenceOriginal

Immutable version: object reference, byte size, cryptographic hash, detected/declared media type, original filename stored as sensitive metadata, upload/finalization states, validation outcome, created timestamp.

### EvidenceDerivative

Thumbnail, preview, raster page, extracted text, OCR, transcript, redaction, translation, archive snapshot, or export copy. Includes generator/adapter/version, parent original/hash, quality warnings, retention, and object reference.

### SourceLocator

Typed location into an original or derivative:

- PDF page and bounding region;
- image region;
- text character range and quote;
- audio/video time range and transcript quote;
- webpage selector/archive offset;
- whole item; or
- external authority citation.

Locator stores the exact source version/hash and extraction version used.

### ProcessingJob

Evidence, pipeline version, stage, state, attempts, lease, progress, warnings, safe error category, cancellation, input/output references, timestamps.

States: `queued`, `running`, `waiting`, `retry_wait`, `needs_input`, `completed`, `failed`, `cancelled`, `superseded`.

### ResearchSource

Case, URL/canonical identifier, title, publisher/court, author, jurisdiction, authority/source type, published/updated/accessed dates, excerpt, archive reference, retrieval method, saved-by, status, reliability limitations.

Research sources remain distinct from user-provided evidence even when placed on the board.

## Structured case knowledge

### CaseFact

Case, proposition label/value, status, origin, sources, accepting/correcting user, accepted timestamp, uncertainty, revision.

Statuses: `suggested`, `accepted`, `corrected`, `disputed`, `uncertain`, `rejected`, `superseded`.

A model cannot create `accepted` directly.

### Entity

Case-scoped person, organization, location, account, device, vehicle, asset, or custom entity. Stores names/aliases, attributes with their own provenance, merge status, visibility, revision.

### Event

Case, title, description, date/time/range precision, time zone, status, participants, locations, sources, origin, revision.

Time precision distinguishes exact, day, month, approximate, before/after, and unknown. Conflicting times are separate propositions or a visible conflict, not averaged.

### IssueTrack

Case, category, jurisdiction, title, description, status, requirements/elements, supporting links, contrary links, missing information, legal/research authorities, user review, revision.

Statuses: `hypothesis`, `researching`, `user_reviewed`, `professional_reviewed`, `not_pursued`, `superseded`.

“Professional reviewed” records the reviewing professional and scope; it does not guarantee correctness or outcome.

### RequirementElement

Issue track, statement of requirement, authority source, applicability status, supporting/contrary/unknown links, review state.

### Conflict

Case, conflict type, object references, explanation, state, user decision, decision rationale, sources, revision.

States: `open`, `explained`, `resolved_for_organization`, `still_disputed`, `superseded`. Resolution does not delete alternatives.

### OpenQuestion

Case, question, why it matters, related issue/evidence, requested source/information, owner, priority, due date, status.

## Board

### Board

Case, name, purpose/template, status, current snapshot/version, created/updated timestamps.

### BoardObject

Stable domain wrapper: board, object type, referenced domain object or visual payload, position/size/rotation/z-order, frame/group, locked state, visibility, created/updated by, revision.

A referenced EvidenceItem is not duplicated when its card is copied; additional BoardObjects point to the same item.

### BoardEdge

Board, source object, target object, semantic/visual type, label, note, direction, created/updated by, revision.

### BoardFrame / BoardGroup

Frame supports chapter/order/presentation metadata. Group/stack supports visual organization without changing domain ownership.

### BoardOperation and BoardSnapshot

Operation: actor, client operation ID, base revision, typed payload, timestamp, result. Snapshot: board version, canonical serialized state, generator version, checksum. History and compaction must preserve audit and undo boundaries.

## Tasks and deadlines

### Task

Case, title, status, priority, assignee, creator/origin, instructions, requested evidence/information, due date/time zone, related objects, checklist, completion evidence, revision.

Statuses: `proposed`, `open`, `in_progress`, `blocked`, `done`, `cancelled`.

AI creates `proposed` unless the user explicitly approves creation as `open`.

### Deadline

Case, title, date/time zone, jurisdiction/source, certainty, related issue/task, reminder policy, review status. AI-discovered deadlines remain provisional until user or qualified reviewer accepts them.

## Collaboration

### Conversation

Case, topic/channel type, name, visibility, status, created by.

### Message

Conversation, author, body representation, reply/thread, attachments/references, edit revision, deletion state, timestamps. Search and AI summaries point to message revisions.

### Comment

Case object reference, author, body, thread, resolved state, visibility, timestamps.

### Decision

Case, statement, alternatives, rationale, source messages/objects, decided by, date, status. AI may propose; a user accepts.

### Presence

Ephemeral connection state only. Retain no detailed behavioral history unless explicitly justified.

### Notification

Recipient, category, safe actor/object references, read state, delivery policy, created/expiry timestamps. Sensitive display content is derived at read time after authorization.

## AI

### AiThread

Case or product-help scope, shared/private visibility, owner, context policy, status, summary version.

### AiMessage

Thread, role/type, safe content reference, model/prompt/retrieval versions for assistant messages, source citations, visibility, timestamps.

### AiFinding

Case, finding type, statement, reasoning summary, supporting/contrary citations, unknowns, jurisdiction, confidence rationale, status, origin versions.

Statuses: `proposed`, `accepted_as_note`, `rejected`, `superseded`. Acceptance as a note does not convert it into an accepted CaseFact.

### AiProposal

Case, thread, action type, target objects, structured payload, sources, risk/reversibility, preview, base revisions, status, requested/approved/executed actors and timestamps.

Statuses: `draft`, `awaiting_approval`, `edited`, `approved`, `executing`, `succeeded`, `partially_failed`, `failed`, `rejected`, `expired`, `undone`.

### ToolExecution

Proposal, tool/version, scoped arguments reference, authorization result, idempotency key, execution result, safe error, timestamps. Sensitive arguments remain in protected storage, not general logs.

### ResearchRun

Case/thread, question, jurisdiction/filters, queries, sources considered/saved, model/tool versions, status, cost/latency metadata, timestamps.

## Reports

### Report

Case, type, title, status, template version, created by/origin, review owner, current version, visibility.

### ReportVersion

Immutable input manifest, source/object revisions, included/omitted sections, redactions, AI generation versions, generated document reference, checksum, approval/export timestamps.

Statuses: `draft`, `reviewing`, `approved`, `exported`, `superseded`, `revoked`.

## Marketplace

### LawyerProfile

User/professional identity reference, public profile fields, verification state, practice areas, languages, locations, consultation modes, moderation status.

### LawyerLicense

Profile, jurisdiction, license identifier protected/public parts, status, issuer, original/latest verification dates, evidence reference, restrictions, next review.

### LawyerService

Profile, service type, duration, price/currency, mode, scope, cancellation policy, active state.

### AvailabilitySlot

Service/profile, start/end/time zone, capacity, reservation/booking state, revision. Slot reservation must be atomic.

### Booking

User, lawyer, service, workspace/case optional reference, state, slot, intake, conflict status, consultation-package version, pricing snapshot, payment state, timestamps, revision.

### ConsultationPackage

Booking, immutable selected object/source revisions, redactions, permissions, expiry, download policy, created/approved by.

### PaymentRecord

Booking/subscription, provider references, amount/currency/tax/fees, state, idempotency, reconciliation timestamps. No raw payment credentials.

### Review

Completed booking, reviewer, lawyer, rating dimensions, text, moderation, lawyer response, edit history, timestamps. Unique per booking.

## Subscription and usage

### Subscription

Workspace/user owner, plan, status, entitlements, provider reference, renewal/cancellation timestamps.

### UsageLedger

Actor/workspace, metric type, quantity, unit, source operation, period, idempotency key. Never include case text.

## Audit and deletion

### AuditEvent

Actor, workspace/case, operation, object type/id, before/after revision references, authorization context, proposal/booking reference, safe outcome/error category, timestamp, correlation ID. Content diffs live in protected domain storage where required, not general audit text.

### RetentionPolicy

Scope, retention duration/rule, legal hold if supported, archive behavior, deletion grace, derivative/export handling, effective dates.

### DeletionRequest and DeletionLedger

Requester, scope, authorization, grace/approval state, jobs cancelled, objects/derivatives/indexes/embeddings/exports covered, completion evidence, exceptions and reason. Purged content is not recoverable through normal application paths.

## Global invariants

1. No accepted fact/event/issue requirement derived by AI exists without user acceptance and reachable sources.
2. Original bytes are immutable; replacement creates a new version.
3. Removing access invalidates cache, realtime, download, and future AI retrieval.
4. Deleting a case covers metadata, originals, derivatives, extracted text, indexes/embeddings, reports, messages according to disclosed retention and legal obligations.
5. A board card cannot grant access to its referenced object.
6. Private AI or message content cannot become shared through summarization or memory without explicit publication.
7. AI proposals execute only against authorized current revisions and do not bundle unrelated destructive/external actions.
8. Lawyer sharing is package-based, recipient-specific, reviewable, time/permission bounded, and audited.
9. Booking/payment transitions are idempotent and reconciled server-side.
10. Current behavior, target behavior, and future behavior remain distinguishable in product and documentation.