# Engineering delivery plan

## Delivery rule

Build vertical slices that create a complete user outcome across UI, domain, storage, authorization, failure recovery, tests, documentation, and operations. Avoid “frontend now, backend later” placeholders that cannot be safely exercised.

Each slice begins with:

- user outcome and non-goals;
- current repository evidence;
- domain/state transitions;
- privacy, authorization, provenance, AI, accessibility, and recovery risks;
- acceptance criteria and evaluation plan; and
- migration/rollback.

## Track A — Decisions and skeleton

### A1. Repository and product transition

- Land canonical documentation, AGENTS rules, and quality template.
- Mark CaseFind current versus EvidenceSpace target.
- Inventory reusable code/tests and conflicting open work.

**Exit:** contributors can identify canonical specs and cannot mistake planned features for current behavior.

### A2. Desktop and canvas architecture spikes

- Electron versus Tauri thin slice.
- Renderer framework decision.
- Canvas engine and collaboration-model benchmark.
- Encrypted local cache and deep-link spike.

**Exit:** ADRs contain runnable measurements on Windows and macOS, security review, cost, migration, and rollback.

### A3. Cloud foundation

- Environment/deployment skeleton.
- PostgreSQL migrations, object-storage quarantine, transactional outbox, worker, and realtime skeleton.
- Synthetic data only.
- CI, secrets, observability, backup/restore baseline.

**Exit:** one synthetic command travels client → API → transaction → event → client with authorization and traceable safe metadata.

## Track B — Identity and first-run

### B1. Desktop signed-in shell

Install, update, authenticate, recover account, secure local session, sign out, resize, and restart.

### B2. Adaptive profile/onboarding

Working mode, country/state, language/time zone, terminology, accessibility, notifications, privacy explanation, and persisted progress.

### B3. Workspace and invitation

Create/switch workspace, accept/expire/revoke invitation, roles, and access-denied/reconnect states.

**Track exit:** a new or invited user can securely reach an empty authorized workspace on Windows and macOS.

## Track C — Case foundation

### C1. Case library and lifecycle

Create, search, reopen, archive, restore, retention, deletion request, and audit.

### C2. AI-guided intake with manual fallback

Narrative draft, high-value questions, jurisdiction/classification, initial unknowns/tasks/board proposal, preview, and case creation. AI failure preserves draft and permits manual creation.

### C3. Case Home

Situation summary, progress dimensions, next step, tasks, deadlines, open questions, activity, and explicit source/analysis freshness.

**Track exit:** a user can create and understand a case without uploading evidence or relying on AI availability.

## Track D — Evidence

### D1. Authorized original upload

File picker and drag/drop; upload intent; preflight; object-storage quarantine; hash/type/size verification; cancellation; duplicate and stale-case handling.

### D2. Processing and source viewer

Preview, extraction/OCR for selected V1 types, locators, warnings, retries, source viewer, and derivative lifecycle. Port/generalize current pipeline tests.

### D3. Evidence library and search

Metadata, tags, filters, list/grid, text search, permissions, URL/text capture, and deletion/retention.

### D4. Import current CaseFind bundle

Versioned import, hash/count validation, unresolved-state preservation, migration report, and unchanged source backup.

**Track exit:** every accepted source-linked object resolves to an authorized original/version and survives retry, reconnect, export, and deletion tests.

## Track E — Board

### E1. Board domain and structured outline

Board, objects, edges, frames, operation/snapshot model, keyboard outline, serialization, migrations, and audit.

### E2. Core 2D interaction

Pan/zoom/select/move, evidence cards, notes, text, shapes, frames, groups, labeled connectors, minimap, history, copy/paste, and error recovery.

### E3. Timeline, tasks, and focus lens

Timeline component, task cards, stacks, filters, connected-path focus, and board chapters/presentation.

### E4. Realtime collaboration

Presence, operations, conflicts/convergence, reconnect replay, permission revocation, history compaction, and recovery.

**Track exit:** representative small/medium/large boards meet approved performance and accessibility criteria on supported platforms.

## Track F — AI copilot and research

### F1. Context and conversation foundation

Product help, private AI, shared Case AI, context chips, visibility, thread history, memory controls, quotas, and safe failure.

### F2. Source-backed Ask and Analyze

Case retrieval, evidence citations, legal/research citation capture, contrary material, unknowns, jurisdiction disclosure, and post-generation verification.

### F3. Plan and task proposals

Structured task/checklist/document-request/deadline proposals, preview, user edits, approval, audit, and undo.

### F4. Board and report action proposals

Ghost layout, add/connect/group/timeline actions, draft report inputs, revision checks, partial-failure recovery.

### F5. Web/legal research

Official-source-first research, source registry, saved research ledger, freshness, archive, and evaluation.

**Track exit:** approved AI evaluation thresholds pass; unsupported claims/actions fail closed; no cross-case/private-to-shared leakage.

## Track G — Room and notifications

### G1. Case Room

Channels/topics, messages, threads, mentions, reactions, pins, deep links, drafts, edits/deletes, search, and access changes.

### G2. Conversions and shared AI

Message-to-task/note/evidence-candidate/research/decision previews and shared AI unread/decision summaries.

### G3. Notifications

In-app notifications, OS-safe previews, preferences, grouping, deadlines, processing, approvals, bookings, and security notices.

**Track exit:** members collaborate through reconnect and permission changes with complete audit and no content leak in notifications.

## Track H — Reports

### H1. Versioned report builder

Input manifest, section inclusion, review states, citations, disputed/stale/private content handling, preview, and versions.

### H2. Redaction and export

True derivative redaction, metadata inspection, PDF/document generation, authorization, download, revocation, and export history.

### H3. Consultation package

Selected case summary, evidence, board frames, timeline, research, questions, recipient/expiry/download preview.

**Track exit:** reports are source-resolvable, accessible, permission-safe, and reproducible from their manifest.

## Track I — Premium and lawyer marketplace

### I1. Subscription entitlements

Plan state, billing pages, provider events, cancellation, invoices, usage explanation, and separation from lawyer fees.

### I2. Lawyer operations and profiles

Application, identity/license verification, re-check, moderation, services, availability, public profile, search/filter/ranking disclosures.

### I3. Consultation request

Conflict-screening intake, selective package, request/accept/decline/reschedule states, notifications, and operations support.

### I4. Transactional booking and payments

Atomic slot reservation, payment, webhooks, reconciliation, refunds, cancellation, disputes, payout state, and audit.

### I5. Verified reviews

Completed-booking eligibility, moderation, response, edit history, abuse reporting, and rating methodology.

**Track exit:** end-to-end booking passes authorization, concurrency, payment replay, selective-sharing, operational, and jurisdictional legal review.

## Track J — Launch hardening

- signed builds and staged auto-update/rollback;
- crash and local-cache recovery;
- performance and soak tests;
- accessibility audit;
- security review and independent penetration test;
- AI red-team and legal-source freshness incident drill;
- backup/restore and regional disaster recovery;
- privacy/export/deletion operations;
- support, moderation, marketplace dispute, and incident runbooks;
- beta migration and staged rollout.

## Parallelization guidance

Can proceed in parallel after contracts exist:

- design system and desktop shell;
- cloud skeleton and synthetic domain contracts;
- AI evaluation corpus and evidence pipeline fixtures;
- marketplace legal/operational research and core case development.

Must remain ordered:

- authorization before realtime subscriptions;
- immutable evidence identity before citations/board evidence cards;
- board operation model before multi-user canvas;
- AI proposal contract before action execution;
- consultation package before lawyer sharing;
- booking state machine before payments/reviews;
- deletion inventory before production retention claims.

## Pull-request sizing

Prefer one observable behavior per pull request. Large foundational changes require an explicit reason and migration/rollback plan. Generated files and fixtures may exceed normal line guidance, but review remains behavior-oriented.

## Completion report

Every slice reports:

- user outcome;
- scope and non-goals;
- domain/contract changes;
- privacy, permission, provenance, AI, and recovery behavior;
- exact checks and observed results;
- platforms/viewports/states inspected;
- migrations and rollback;
- current limitations; and
- next dependency or weakest area.

Never report an environment, test, build, benchmark, accessibility review, or security control that was not actually observed.