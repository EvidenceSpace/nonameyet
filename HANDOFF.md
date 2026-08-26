# EvidenceSpace AI development handoff

**Status:** living continuity report  
**Last reconciled:** 2026-08-26  
**Audience:** a new human maintainer or advanced coding agent taking over with no access to the prior product conversation

## Purpose

This file preserves the product decisions, repository reality, trust boundaries, delivery order, unresolved choices, and collaboration expectations needed to continue EvidenceSpace without restarting discovery or drifting into a different product.

It is a continuity map, not a replacement for the canonical specifications. When this summary and a linked contract disagree, reconcile the contradiction explicitly; do not silently choose whichever instruction is easiest.

## Mandatory takeover sequence

Before proposing or changing code:

1. Refresh `main`, record its exact commit, and inspect open pull requests and required checks.
2. Read this file completely.
3. Read `AGENTS.md` and `docs/README.md`.
4. Read `docs/decisions/0001-evidencespace-target-product.md`.
5. Read the product, engineering, and design contracts relevant to the intended slice.
6. Inspect the current implementation, schemas, callers, tests, migrations, and recent history for that slice.
7. State what is **Current**, **Partial**, **Target V1**, **Future**, or **Decision required** before implementation.

Do not ask the user to repeat decisions already recorded here. Ask only when a materially unresolved choice cannot be settled through a measured technical spike, existing product principles, or safe defaults.

## Repository snapshot and truth

The product repository is `EvidenceSpace/nonameyet`.

The blueprint preceding this handoff was merged to `main` in commit `b4527a5a89fe75ed4afed988010d0ca90f4bd8e0` through PR #93. Always refresh the current head because this snapshot becomes historical as work continues.

`main` is not an empty starter. It contains a substantial browser prototype named **CaseFind**. The prototype is local-first and focused on unpaid freelance payment disputes. It includes valuable engineering foundations, but it is not the accepted EvidenceSpace V1 product.

Current prototype foundations worth preserving or migrating deliberately include:

- immutable original files and SHA-256 provenance;
- browser-local IndexedDB storage and versioned migrations;
- local PDF extraction and image OCR paths;
- typed extraction and AI contracts;
- source-linked facts and events;
- suggested, confirmed, corrected, dismissed, and uncertain review states;
- deterministic consistency/conflict review;
- evidence processing retries, cancellation, and recovery paths;
- encrypted backup and restore concepts;
- reports, archive, permanent deletion, and recovery;
- optional OIDC/account foundations; and
- broad deterministic and Playwright coverage.

Never present target desktop, cloud, realtime, collaboration, marketplace, or full copilot behavior as implemented merely because it is specified.

## Product definition

EvidenceSpace is an online Windows and macOS desktop workspace where a user can create a controlled environment for a real or educational case, preserve and organize evidence, connect material on a 2D board, collaborate with authorized people, receive truthful source-backed AI assistance, produce reviewed reports, and—on Premium—discover and book a verified lawyer.

The core experience loop is:

**capture → preserve → organize → understand → decide → act → review**

Every stage must retain provenance, permissions, uncertainty, reversibility where possible, and clear human control.

The product is meant to feel advanced, interactive, engaging, and visually exceptional without turning serious legal or investigative work into a game. Professional quality means fewer contradictions, reliable recovery, justified recommendations, accessible interaction, and excellent information design—not maximal animation or feature count.

## User-approved product decisions

### Audience

Do not gate the product to a single persona. Individuals, licensed professionals, investigators/reviewers, organizations, students, and educators may all use the same product.

Adaptive onboarding changes vocabulary, explanations, templates, default board frames, and recommended actions. It must not create a weaker truth, provenance, or safety model for any audience.

### Case vocabulary

Terminology depends on the matter:

- criminal: possible offenses or charges;
- civil: claims, defenses, remedies, and damages;
- administrative: violations, complaints, and appeals;
- family: applications, rights, and orders; and
- education: clearly labeled simulations.

Do not force the word “charge” into every case type. Do not imply that the product itself files, proves, authenticates, or adjudicates anything.

### Jurisdiction

Onboarding and case intake capture country and, where applicable, state/province/region and governing jurisdiction. Jurisdiction may differ by case and must remain confirmable rather than silently inferred.

Legal research and analysis display jurisdiction, authority type, relevant dates, source freshness, and coverage limits. The product must not claim complete worldwide legal coverage.

### Platform and connectivity

Target V1 is an **online desktop application for Windows and macOS**. Internet access is an accepted product requirement because AI, research, collaboration, accounts, sync, and marketplace services depend on it.

An encrypted local cache supports draft recovery and temporary connectivity loss, but V1 does not promise a separate offline collaboration mode or independent offline source of truth.

Major technology decisions—including Electron versus Tauri, renderer framework, canvas engine, realtime implementation, cloud providers, legal-content providers, AI providers, and payment provider—remain **Decision required** until measured spikes and ADRs resolve them.

### Product sequencing

Build the application before the promotional website. Do not let a visually impressive landing page substitute for a trustworthy working product.

The immediate product foundation is the desktop shell, case model, evidence pipeline, Case Home, and 2D board. The marketing website is deferred and specified in `docs/product/marketing-site-later.md` so it is not forgotten.

### Explicitly rejected or corrected scope

Prior references to coding competitions, tournaments, fights, duo/squad modes, or similar game concepts were mistakes and are not related to EvidenceSpace. Do not reintroduce them.

EvidenceSpace is not:

- a game or competitive social network;
- an outcome, guilt, liability, admissibility, authenticity, or win-probability predictor;
- a replacement for a licensed lawyer;
- a hidden surveillance or automatic evidence-collection system;
- an autonomous filing, messaging, booking, payment, deletion, or evidence-mutation agent; or
- a generic infinite-canvas toy with legal styling.

## Target V1 experience map

### Global surfaces

1. **Welcome, sign-in, and recovery** — account creation, authentication, secure recovery, privacy and product-boundary explanation.
2. **Adaptive onboarding** — role/use, experience, country, state/region, language, accessibility, notification preferences, and first-workspace setup.
3. **Global Home** — active matters, deadlines, invitations, notifications, recent activity, and clear next steps.
4. **Cases library** — search, filters, sort, active/archived states, safe deletion, and create-case entry.
5. **AI-guided case creation** — case type, jurisdiction, people/organizations, situation, goals, urgency, privacy, first sources, and review before creation.
6. **Notifications** — permission-aware updates with no private case content in unsafe channels.
7. **Profile, workspace, privacy, billing, and support settings** — memberships, preferences, sessions, data controls, subscription, usage, help, and feedback.

### Case surfaces

8. **Case Home** — overall situation, organization progress, source-backed AI briefing, recommended next step, upcoming deadlines, missing information, open questions, tasks, processing warnings, member activity, and report readiness. Progress reflects organization—not likelihood of winning.
9. **2D Board** — infinite but bounded and recoverable canvas, evidence and research cards, visual elements, entities, events, issue tracks, tasks, frames, labeled connectors, timeline elements, comments, history, minimap, and accessible structured outline.
10. **Evidence/source viewer** — original, derivatives, exact locators, metadata, hash/version, extraction warnings, related accepted/provisional objects, comments, permissions, download/export, and safe deletion consequences.
11. **Web Research** — official-source-first legal and factual research, visible research steps, source hierarchy, jurisdiction, dates, saved excerpts, citations, and a research ledger.
12. **Room** — V1 collaboration center with invitations, roles, chat, threads, mentions, reactions, pins, presence, file/source previews, decisions, shared AI, unread summaries, and message conversion to task/evidence/note.
13. **Reports** — case overview, chronology, evidence index, people/relationship summary, issue matrix, contrary material, open questions, tasks/decisions, and research ledger with review, redaction, versions, and export.

### Premium professional-help surfaces

14. **Find a Lawyer** — search and compare verified professionals by jurisdiction, practice area, language, availability, pricing, review quality, and remote/in-person mode.
15. **Lawyer profile** — verified license scope/date, description, experience, services, languages, price, availability, ratings, verified reviews, disclosures, and booking entry.
16. **Booking and consultation** — minimal conflict-screening intake, slot hold, consultation request, payment, cancellation/refund policy, selective case package, secure messages, and clear distinction among marketplace use, consultation, engagement, and representation.

The detailed page contract is `docs/product/page-specifications.md`; this list must not become a competing implementation spec.

## Case Home intent

The user specifically requested a strong home page that communicates progress and the overall case situation. The Case Home should answer, at a glance:

- What is this matter and what jurisdiction/classification is active?
- What changed since the last session?
- What is confirmed, provisional, disputed, missing, stale, or blocked?
- Which evidence still needs processing or review?
- What deadlines and requested documents matter next?
- What is the AI’s source-backed assessment and contrary view?
- What is the single best next action and why?
- Who has access and what collaboration activity occurred?

Avoid invented case-health scores. If a summary metric exists, expose its inputs and label it as organization readiness.

## 2D board contract

The board is the visual center of EvidenceSpace for V1. It must be controlled equally by direct user interaction and approval-gated AI proposals.

Required layout:

- top toolbar for board/case identity, history, search, members, sharing, focus/presentation, marketplace shortcut, and sync state;
- left tool rail with a searchable, resizable drawer for Uploads, Evidence, Elements, Web Research, Timeline, Tasks, Text, Draw/Marker, Connect, and Frames;
- central 2D canvas with pan, zoom, snapping, frames, grouping, locking, z-order, selection, autosave, recovery, and stable serialization;
- right AI/Properties/Comments/Activity panel; and
- bottom zoom, minimap, fit, current-frame, outline, keyboard-help, and performance controls.

Required object families:

- evidence cards;
- saved research sources;
- people/organizations/locations and other entities;
- events with confirmed, estimated, or disputed dates;
- issue tracks for claims, charges, defenses, remedies, complaints, or educational theories;
- tasks with title, status, priority, assignee, deadline, instructions, and requested evidence/information;
- sticky notes, text, shapes, photo frames, icons, markers, labels, groups, stacks, and frames;
- a resizable timeline element; and
- typed semantic connectors such as supports, contradicts, mentions, occurred before/after, communicated with, belongs to, located at, requires, and assigned to.

Visual-only objects and unlabeled lines are never evidence or interpreted relationships. Copying a card never duplicates or grants access to the original evidence.

Engaging 2D behavior may include focus lenses, evidence stacks, board chapters, timeline scrubbing, contradiction comparisons, smart-layout ghost previews, and restrained causal animation. Accessibility requires an equivalent structured outline; color, position, gesture, hover, motion, and sound cannot be the only meaning.

The user also requested online attachments, images, videos, and animation assets. These may enter through Elements or Web Research only with explicit source/licensing metadata, privacy-safe previewing, and a clear distinction between visual material, saved research, and user-submitted evidence.

## Evidence and provenance contract

- Preserve every original byte-for-byte.
- Keep OCR, transcript, preview, redaction, translation, archive, and export as separate derivatives.
- Bind every derivative to the exact original hash/version and a typed source locator.
- Treat “evidence” as an organizational label, not a certification of authenticity or admissibility.
- AI-derived material begins provisional and cannot mark itself confirmed.
- Never silently choose between conflicting dates, amounts, identities, events, sources, claims, or authorities.
- Missing, stale, changed, deleted, malformed, or unauthorized provenance fails closed with a repair path.
- Retention, archive, deletion, cache invalidation, search/embedding removal, backup, restore, and derivative cleanup are explicit and testable.

## AI copilot contract

The AI is persistent across the authorized case context and can understand current case objects, board state, tasks, research, reports, and shared conversation. It is not allowed to mutate the workspace invisibly.

Modes:

- **Ask** — answer product, object, view, thread, report, or case questions.
- **Analyze** — find patterns, contradictions, gaps, requirements, alternative interpretations, and risks.
- **Plan** — propose tasks, deadlines, document requests, questions, and investigation order.
- **Research** — search legal and factual sources, show the research path, and offer selected results for saving.
- **Act** — propose board, task, timeline, report, organizational, or consultation-package changes.

The user wanted a “truthful lawyer” personality. Implement this as a calm, professionally skeptical legal-assistant posture—not impersonation. The AI should tell the user when sources cut against their preferred position, explain why, avoid flattery, distinguish evidence from inference and strategy, and end substantive work with a justified next step.

A material answer includes:

1. direct assessment;
2. reasoning;
3. exact case-evidence citations;
4. relevant legal/research sources with jurisdiction and dates;
5. contrary material and weaknesses;
6. assumptions and unknowns;
7. qualitative, justified uncertainty; and
8. the next recommended step, with optional action proposals.

AI action lifecycle:

**proposal → affected-object/source preview → authorization and revision checks → user edit/approval/rejection → idempotent execution → verification → audit → safe undo when genuinely possible**

Sharing, messaging, booking, payment, filing, retention changes, and deletion require dedicated confirmation and cannot be hidden inside generic approval.

### AI memory and visibility

- user memory: user-approved language, terminology, accessibility, and workflow preferences;
- workspace memory: policies, templates, vocabulary, and roles;
- case memory: accepted facts, provisional findings, graph, events, issues, tasks, decisions, research, and audit;
- conversation memory: source-linked thread messages and summaries.

Shared Case AI is visible to authorized members and can become part of official case work. Private AI remains visible only to its user until selected output is published through a destination/visibility preview. Invited members can read prior shared case conversation according to role and case access, never private threads.

Uploaded files, webpages, messages, comments, metadata, filenames, and model output are untrusted data—not instructions. Prompt injection cannot change policy, tool scope, permissions, sharing, or approval requirements.

## Collaboration contract

Chat is the primary V1 collaboration mode. Native voice/video calls are deferred.

The Room must support:

- owner, admin, editor, reviewer, and guest roles;
- scoped invitations, expiry, revocation, and clear access previews;
- chat, threads, mentions, reactions, pins, decisions, file/source previews, and board deep links;
- shared AI conversation and permission-aware summaries;
- conversion of a message to a task, evidence candidate, note, question, or decision with preview;
- presence and reconnect behavior that does not imply unsaved work is safe; and
- an audit trail showing who changed what.

Never broaden private content into a shared case merely because it is useful. Revoked users must lose reads, writes, subscriptions, signed URLs, cache access, exports, and AI retrieval.

## Reports contract

Reports include reviewed case material and research rather than merely reformatting the board. Required sections include overview, chronology, evidence index, people/relationships, issue matrix, supporting and contrary material, open questions, task/decision history, and research ledger.

Every included claim must retain its source and review state. Reports distinguish AI-derived, disputed, omitted, stale, redacted, and professional-reviewed content. Generation, preview, redaction, versioning, export, and selective sharing are permission-checked and auditable.

## Premium lawyer marketplace contract

Find a Lawyer is a Premium feature. Users can discover, search, filter, compare, review, and book professionals.

Required safeguards:

- license and jurisdiction verification with source, scope, date, revalidation, suspension, and appeal paths;
- complete profile, services, practice areas, languages, availability, pricing, remote/in-person mode, disclosures, ratings, and verified reviews;
- relevance ranking separated from sponsored placement;
- verified-booking review eligibility and moderation;
- minimum-necessary conflict-screening data with no exposure of another client;
- a recipient-specific, user-reviewed consultation package rather than automatic whole-workspace sharing;
- concurrency-safe slot holds, booking, payment, refund, webhook, and reconciliation state machines;
- separate subscription and consultation-payment ledgers; and
- clear distinction between consultation, engagement, and formal representation.

Essential emergency and public legal-aid guidance must not be withheld solely because the user lacks Premium.

## V1 scope and future scope

### Target V1

- online Windows/macOS desktop client;
- identity, adaptive onboarding, workspaces, cases, and Case Home;
- evidence ingestion, processing, source viewing, and provenance;
- interactive 2D board and accessible outline;
- source-backed AI and Web Research;
- Room chat and collaboration;
- reports and professional-review package; and
- Premium Find a Lawyer, booking, selective sharing, and payments.

### Future unless explicitly promoted through an ADR and revised roadmap

- optional 3D board/spatial environment;
- restrained opt-in sound effects;
- native audio/video calls;
- WhatsApp, Discord, social, mailbox, call-log, cloud-drive, and other broad connectors;
- mobile application or secure-capture companion;
- richer specialist multi-agent workflows behind one coherent copilot;
- advanced relationship and temporal analysis;
- enterprise SSO, policy, legal hold, and retention controls; and
- professional filing/court integrations where justified.

Background surveillance, implicit device collection, outcome prediction, and autonomous destructive/financial/legal actions are not future goals without a fundamental product decision and legal review.

## Deferred promotional website

The website comes after the application has a stable, demonstrable vertical slice. Its goals are to promote the product, explain how it works, show features truthfully, provide downloads, pricing, support and feedback, and explain trust/privacy/legal boundaries.

The user wants the website to feel immersive, animated, modern, and unusually engaging, potentially using generated images, video, or three-dimensional storytelling. That creative ambition applies to the marketing experience and does not change the 2D V1 app decision.

The website may take inspiration from high-quality interactive storytelling, but must not copy another site’s layout, code, assets, wording, or brand. It must be accessible, performant, reduced-motion aware, honest about current availability, and incapable of leaking real case data into demos or analytics.

See `docs/product/marketing-site-later.md`.

## Architecture direction

The target is a typed desktop client, modular cloud backend, PostgreSQL metadata source of truth, encrypted object storage, bounded evidence workers, realtime event delivery, search/indexing, model gateway, citation verification, report generation, marketplace/payments, and privacy-safe observability.

Architecture rules:

- prefer a modular monolith and explicit bounded contexts before distributed complexity;
- keep domain objects independent of UI/canvas vendor schemas;
- validate every process, network, file, queue, provider, and desktop-bridge boundary at runtime;
- enforce server-side authorization for every read, write, subscription, download, AI retrieval, export, and lawyer share;
- make multi-record invariants transactional and retried commands idempotent;
- define realtime replay, deduplication, cursor/version, backpressure, revocation, and convergence;
- encrypt and account-bind the minimal local cache;
- never claim end-to-end encryption while server-side processing needs plaintext; and
- use measured ADRs before locking major stack/provider decisions.

Canonical details are in `docs/engineering/target-architecture.md`, `domain-model.md`, and `security-ai-governance.md`.

## Delivery order

Do not attempt a broad rewrite. Build vertical slices with domain, storage, API, authorization, UI, tests, telemetry, docs, migration, and rollback together.

Recommended sequence:

0. Restore a trustworthy CI signal and inspect the exact failing job/log.
1. Complete measured desktop-shell, renderer, canvas-engine, and collaboration-operation spikes; write ADRs.
2. Establish design tokens and accessible desktop shell.
3. Implement identity, onboarding, secure sessions, encrypted recovery cache, and workspace switching.
4. Implement cases and Case Home.
5. Migrate evidence/provenance foundations into cloud-backed storage and processing.
6. Implement the 2D board and structured outline.
7. Add source-backed AI, research, proposals, audit, and memory boundaries.
8. Add Room collaboration and realtime recovery.
9. Add reports and selective professional-review packages.
10. Add Premium Find a Lawyer only after identity, permissions, billing, verification, conflict, and operational systems are ready.
11. Harden release, accessibility, security, disaster recovery, legal review, and staged rollout.

The full milestone and engineering-track details live in `docs/product/roadmap.md` and `docs/engineering/delivery-plan.md`.

## Quality bar

A task is not complete because a screen renders or a model produces an answer. Completion requires:

- the user outcome works end to end;
- current/target/future status remains truthful;
- states, invariants, authorization, provenance, concurrency, retries, failure, recovery, and rollback are handled;
- accessibility and relevant Windows/macOS visual states are inspected;
- AI citations and proposed actions pass deterministic and evaluation gates;
- privacy-safe telemetry and operational recovery exist;
- exact commands, platforms, counts, and observed results are reported; and
- docs, handoff status, migration, remote commit, and required CI match reality.

Never report “expected to pass” as a passed check. Never weaken a validator or test to make CI green. Use synthetic or explicitly approved test data only.

## Current CI and pull-request context

At the time this handoff was written, the repository’s single quality check was completing with `failure` after only a few seconds on multiple pull requests. The available GitHub integration did not expose the job log, so the exact cause is not proven.

PR #87 (`Restore quality CI and harden storage recovery coverage`) contains a proposed TypeScript version correction, workflow restructuring, and many prototype/test changes. It is broad and based on the pre-blueprint `main`; do not merge it wholesale without rebasing, inspecting the exact Actions error, separating the minimal CI repair from unrelated changes, and rerunning the exact-head checks.

PR #88 and PR #91 were closed as superseded by the canonical EvidenceSpace `AGENTS.md`, quality, delivery, and UX contracts merged through PR #93. Do not reopen and merge them over the new instructions.

Other older open pull requests are based on the pre-blueprint prototype and require explicit reconciliation:

- #86 — timeline atomicity work;
- #89 — first-run visual foundation;
- #90 — case-library foundation stacked on #89; and
- #92 — broad local-review integration draft.

Do not discard useful prototype work solely because it predates the pivot, and do not merge it wholesale solely because it exists. Rebase or extract narrow improvements only after comparing them with the target contracts and current `main`.

## Collaboration and merge preference

The repository owner wants canonical specifications and completed, reviewed work on `main`, not stranded on long-lived branches. Normal branch creation, pull requests, review, and merge are authorized without asking for permission each time.

Interpret that preference professionally:

- use focused branches and reviewable pull requests as staging;
- merge coherent work once its applicable gates and remote diff are verified;
- do not leave canonical decisions only in chat or an unmerged branch;
- do not merge temporary experiments, generated diagnostics, known unsafe changes, or unrelated branch bundles merely to empty the PR list;
- keep durable automated tests with the code they protect—tests are part of production quality, not disposable clutter; and
- never use the authorization to fabricate verification, bypass platform protections, expose secrets, or perform unrelated destructive actions.

If a required check is unavailable because of repository infrastructure, record the exact blocker, repair the signal as the highest-priority engineering task, and keep claims limited to what was actually observed.

## Continuity protocol for every future advanced agent

After a material product decision or merged vertical slice:

1. Update the canonical product/engineering contract first.
2. Update this handoff only where repository status, accepted decisions, active blockers, current implementation, or next work changed.
3. Add an ADR for lasting architecture or scope choices.
4. Replace stale commit/PR references rather than accumulating contradictory status sections.
5. Preserve historical implementation documents or mark them superseded with a link.
6. Summarize exact verification and unverified areas in the pull request.
7. Merge reviewed canonical work to `main` and verify the remote head.

A new agent should be able to answer these questions after reading the repository alone:

- What exists today?
- What is the accepted V1?
- What is deliberately postponed?
- What must never be compromised?
- What is blocked or undecided?
- What should be built next?
- Which evidence proves a claim of completion?

If the repository cannot answer one of those questions, improve the documentation as part of the next relevant slice rather than relying on private conversation memory.
