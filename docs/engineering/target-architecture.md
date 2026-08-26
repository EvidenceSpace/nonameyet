# EvidenceSpace target architecture

## Status

- **Current:** static browser application, IndexedDB case storage, optional Node analysis/account runtime.
- **Target V1:** online Windows/macOS desktop client backed by authorized cloud services.
- **Decision required:** final desktop shell, canvas engine, cloud provider, payment provider, and legal-content providers.

This document defines boundaries and selection criteria. A proposed technology is not adopted until an ADR and a working cross-platform spike confirm it.

## Architecture qualities

Prioritize, in order:

1. case confidentiality and least-privilege authorization;
2. provenance and audit integrity;
3. recoverability under failure, retry, reconnect, and concurrent edits;
4. clear user control over AI and sharing;
5. usable performance on representative Windows and macOS hardware;
6. accessibility and predictable interaction;
7. operability, observability, and incident response; and
8. cost efficiency based on measured workloads.

## Recommended target shape

```text
Windows/macOS desktop client
  ├─ renderer UI and 2D board
  ├─ hardened desktop shell and updater
  ├─ encrypted local cache and draft journal
  └─ typed API/realtime client
              │
              ▼
API / authorization boundary
  ├─ identity, sessions, workspaces, memberships
  ├─ cases, evidence metadata, board, tasks, chat, reports
  ├─ lawyer marketplace, subscriptions, bookings, payments
  ├─ signed upload/download orchestration
  └─ audit and notification commands
              │
       ┌──────┼───────────┐
       ▼      ▼           ▼
PostgreSQL  Object      Realtime/event
metadata    storage     delivery
       │      │           │
       └──────┼───────────┘
              ▼
Bounded workers
  ├─ malware/type validation and derivatives
  ├─ OCR/transcription and indexing
  ├─ AI retrieval, research, analysis, and proposal execution
  ├─ report generation and redaction
  └─ notification and payment reconciliation
```

A modular monolith is the preferred first backend shape. Split a service only after measured load, isolation, deployment, or regulatory needs justify it.

## Repository organization target

Proposed migration layout:

```text
apps/
  desktop/          hardened shell, preload bridge, renderer entry
  api/              HTTP/realtime API and authorization boundary
  worker/           bounded asynchronous jobs
  operations/       internal marketplace/support tools
packages/
  domain/           entities, state machines, invariants
  contracts/        API, events, AI tool and structured-output schemas
  ui/               tokens and accessible components
  board/            board model, operations, serialization, outline adapter
  evidence/         provenance, processing, locators, derivatives
  ai/               retrieval, grounding, model gateway, proposals, evals
  testing/          synthetic fixtures and shared test helpers
docs/
```

Do not reorganize the current prototype into this shape as a formatting exercise. Introduce the layout through vertical slices with migration tests.

## Desktop client

### Proposed default

Use a web-rendered desktop shell so the board, collaboration, reports, and future call UI share one cross-platform implementation. Electron is the default candidate because of ecosystem maturity and compatibility with the existing web foundation; Tauri remains a candidate if a spike demonstrates equal board, updater, accessibility, security, and team-operability results with acceptable Rust complexity.

### Required spike

Build the same thin slice in each serious candidate:

- signed-in shell;
- one case list;
- board with representative objects and keyboard outline;
- upload through a narrow native bridge;
- encrypted local draft cache;
- deep link;
- secure update path;
- accessibility tree inspection;
- crash/restart recovery; and
- packaged Windows/macOS build size, startup, memory, and frame-rate measurements.

### Shell security requirements

- renderer sandbox and context isolation;
- no general Node/system access in renderer;
- allowlisted, typed, versioned native bridge;
- strict content security policy;
- safe navigation/window-open handling;
- verified deep links;
- signed builds and authenticated updates;
- OS keychain/credential store for local secrets;
- no case content in crash reports; and
- explicit permission prompts for filesystem, camera, microphone, and notifications.

## Renderer application

A typed component architecture is required for the new app. React with TypeScript is the default proposal because of available canvas/realtime patterns and hiring/maintenance depth, but adoption requires an ADR that addresses bundle size, testing, accessibility, and migration from the current plain JavaScript pages.

Required client layers:

- routing and permission-aware app shell;
- normalized server state and deterministic local drafts;
- design tokens and accessible primitives;
- board model separated from rendering;
- structured outline equivalent for canvas semantics;
- typed commands and optimistic updates with rollback;
- realtime event reconciliation;
- local encrypted cache with explicit ownership; and
- analytics boundary that accepts event metadata, never case content.

## Board engine decision

Do not build or adopt the canvas engine solely from a visual demo. Evaluate candidate engines and a narrow custom model against:

- license and commercial terms;
- 1,000+ representative objects and dense connections;
- stable serialization and migration;
- custom object rendering;
- collaboration operation model;
- selection, snapping, grouping, frames, connectors, minimap, and history;
- keyboard and screen-reader outline integration;
- copy/paste and drag/drop safety;
- memory behavior and recovery;
- reduced motion; and
- export/presentation requirements.

The EvidenceSpace domain model owns object identity and provenance. A canvas vendor’s internal schema cannot become the only source of truth.

## API and authorization

Every request and subscription resolves:

1. authenticated actor;
2. workspace membership and role;
3. case membership and policy;
4. object-level visibility where used;
5. current revision/precondition;
6. requested operation; and
7. audit classification.

Use typed request/response/event contracts with runtime validation. Write commands are idempotent where retry is possible. Multi-object invariants execute transactionally.

The API issues short-lived, object-scoped upload/download access. Object keys are unguessable but never treated as authorization.

## Primary data store

PostgreSQL is the proposed system of record for metadata, relationships, permissions, audit references, tasks, messages, board operations/snapshots, marketplace, and billing state.

Requirements:

- explicit tenant/workspace/case keys on protected records;
- foreign keys and constrained state transitions where practical;
- migrations tested against representative prior schemas;
- row-level security considered as defense in depth, not the sole authorization layer;
- transactional outbox for events that must follow committed data;
- backup, point-in-time recovery, restore tests, and deletion workflows; and
- encrypted storage and managed key rotation.

## Evidence object storage

Use encrypted S3-compatible object storage or equivalent with:

- immutable original version;
- hash and byte-size verification;
- separate derivative/redaction/thumbnail/transcript objects;
- malware and format validation quarantine;
- short-lived signed access;
- case and evidence ownership metadata outside user-controlled filenames;
- lifecycle rules subordinate to case retention;
- deletion ledger covering versions and derivatives; and
- no public buckets.

Direct upload avoids routing large media through the API, but finalization requires server verification before an item becomes available.

## Local cache and offline boundary

V1 requires internet access. The local cache exists for speed, drafts, and crash/reconnect recovery—not independent offline collaboration.

Cache only the minimum necessary authorized data. Encrypt it, bind it to account/workspace, invalidate on sign-out or access loss, and keep a versioned draft/operation journal. Reconnection must reauthorize before replay and must not resurrect deleted objects.

## Realtime collaboration

Use a permission-checked WebSocket or equivalent channel for:

- presence and typing;
- message delivery;
- task and comment updates;
- board operations;
- AI proposal status; and
- processing/booking notifications.

Requirements:

- monotonic event cursor or version;
- reconnect and missed-event replay;
- idempotent event handling;
- revision/conflict rules;
- backpressure and large-board protection;
- permission revocation propagation; and
- no sensitive payload in channel names or infrastructure logs.

Board collaboration model—operation transform, CRDT, or server-ordered commands—is a Decision required after a focused spike. Choice must be based on deterministic convergence and undo semantics, not trend popularity.

## Evidence processing workers

Workers are bounded, observable, and idempotent. Pipeline stages include:

1. final upload validation and hashing;
2. malware/content-type inspection;
3. preview/thumbnail/raster derivatives;
4. text extraction, OCR, and transcription;
5. locator construction and quality warnings;
6. search indexing;
7. optional AI candidate extraction; and
8. completion/failure event.

Preserve useful current pipeline invariants: versioned adapters, file/hash binding, retries only for retryable failures, cancellation, output limits, and structured AI handoff.

## Search and retrieval

Start with metadata and PostgreSQL full-text search where it meets measured requirements. Add a dedicated search service or vector index only after evaluation demonstrates a specific retrieval gain.

Indexes contain permission-scoped document identifiers and derived text, not unrestricted originals. Search rechecks authorization before returning metadata or snippets. Embeddings, if introduced, inherit retention and deletion obligations and are never treated as anonymous.

## AI platform

Components:

- model gateway with provider policy, redaction, quotas, and fallbacks;
- prompt/instruction registry with versioning;
- case retrieval service with permission and provenance checks;
- legal/web research adapter with source capture;
- structured output validator;
- citation verifier;
- tool/action proposal planner;
- approval and execution service;
- evaluation harness and synthetic corpus;
- privacy-safe cost/latency telemetry; and
- audit events referencing versions without logging private prompts.

Send the smallest sufficient context. Provider choice is workload-specific and based on measured grounding, safety, latency, and cost. No single model is permanently assumed to be “best.”

## Notifications

Separate durable in-app notifications from OS notification delivery. Store object references and safe display metadata; lock-screen previews default to generic. Email or other channels are Future connectors unless explicitly approved.

## Reports

Report generation receives an immutable, permission-checked input manifest. It records report version, source revisions, AI/model/prompt versions where relevant, omissions, redactions, and generator version. Export jobs are idempotent and do not reuse stale authorization.

## Lawyer marketplace and payments

Marketplace domains remain in the modular backend but have stricter operational boundaries:

- lawyer application and verification;
- license jurisdictions and revalidation;
- profile moderation;
- availability and slot reservation;
- conflict-screening intake;
- selective package sharing;
- booking state machine;
- subscription and separate consultation payment ledgers;
- webhook verification and reconciliation;
- review eligibility/moderation; and
- support/dispute tooling.

Payment and payout provider is a Decision required. Booking confirmation follows reconciled server state, never only a client redirect.

## Observability

Collect:

- request/job/event IDs;
- operation type and safe error category;
- latency, queue age, retry, resource use, and model cost;
- sync/reconnect/crash metrics;
- authorization denials and security events; and
- source/citation validation outcomes.

Never collect case text, extracted content, source quotes, message bodies, lawyer-conflict details, tokens, signed URLs, raw prompts, or uploaded filenames in general telemetry. Sensitive diagnostic access requires a separate consented support workflow.

## Environments and delivery

At minimum: local, automated test, staging with synthetic data, and production. Use infrastructure as code, reviewed secrets management, isolated production access, audit logging, dependency and image pinning, database migration gates, rollback, and disaster-recovery exercises.

Desktop releases use staged channels, signed artifacts, update verification, rollback/kill switch, and release notes. A backend contract remains compatible with supported client versions or explicitly forces a safe update.

## Migration from current prototype

1. Freeze and document current local schema/export format.
2. Add a versioned migration/export contract and fixtures.
3. Extract reusable domain, provenance, processing, and AI-validation concepts behind typed packages.
4. Build the new shell and cloud foundation as vertical slices.
5. Offer explicit import of a local CaseFind bundle into a new EvidenceSpace case.
6. Validate counts, hashes, facts, events, and unresolved suggestions before commit.
7. Keep the original backup untouched and provide a migration report.
8. Retire old paths only after supported migration, retention, and rollback windows.

## Architecture decisions required before implementation

- desktop shell and update system;
- renderer framework and build tooling;
- board engine and collaboration model;
- cloud/deployment provider;
- identity provider and session strategy;
- database migration tooling;
- object storage and malware scanning;
- OCR/transcription providers and local/cloud split;
- legal research content/providers by jurisdiction;
- AI providers and data-retention contracts;
- payment/payout provider;
- analytics/observability stack; and
- local cache database and key management.

Each ADR includes a runnable spike, measured results, threat implications, operational ownership, cost model, migration, and rollback.