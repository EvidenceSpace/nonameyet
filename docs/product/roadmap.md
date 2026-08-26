# EvidenceSpace roadmap

This roadmap expresses dependency order and product intent, not calendar promises. A milestone ships only after its exit criteria are observed on supported Windows and macOS environments.

## Current foundation: CaseFind prototype

Preserve and generalize:

- original-file integrity and hashing;
- source locators and provenance;
- extraction pipeline and structured AI contracts;
- suggested/confirmed/corrected/uncertain states;
- conflict visibility;
- encrypted backup, deletion, and recovery concepts;
- report provenance; and
- deterministic and Playwright quality coverage.

Do not market this foundation as the EvidenceSpace V1 experience.

## Milestone 0 — Product and architecture foundation

### Add

- accepted page, board, AI, collaboration, marketplace, domain, security, and quality contracts;
- desktop-shell, UI-framework, canvas-engine, backend, realtime, and deployment spikes;
- migration plan for current local cases;
- design tokens and accessible component baseline;
- privacy-safe product analytics plan; and
- representative synthetic evaluation fixtures.

### Exit

- ADRs resolve the major stack decisions;
- threat model covers case access, files, AI tools, realtime, and lawyer sharing;
- one vertical prototype runs on Windows and macOS; and
- product language clearly separates current, target, and future behavior.

## Milestone 1 — Identity, onboarding, and desktop shell

### Add

- signed desktop builds for Windows and macOS;
- account creation, sign-in, recovery, secure session handling, and updates;
- profile, role/use selection, country/state, language, accessibility, and notification preferences;
- workspace creation and switching;
- online/connecting/error states and encrypted local cache shell.

### Exit

A new user can install, sign in, complete adaptive onboarding, reopen the app, and recover safely from interrupted connectivity without seeing a blank or contradictory state.

## Milestone 2 — Cases and Case Home

### Add

- cases library, search, archive, retention, and deletion;
- AI-guided case intake;
- jurisdiction and case-type confirmation;
- Case Home with organization progress, next step, deadlines, open questions, tasks, member activity, and source-backed AI briefing.

### Exit

A user can create, reopen, understand, archive, and permanently delete a case with complete authorization and audit coverage.

## Milestone 3 — Evidence foundation

### Add

- explicit file picker, drag/drop, clipboard capture, URL capture, and text entry;
- cloud object storage with immutable original version, hash, malware/content-type checks, derivatives, OCR/transcription states, retries, cancellation, and deletion;
- evidence library, metadata, tags, source viewer, structured list, search, duplicate handling, and permission checks.

### Exit

Every displayed source-backed object resolves to an authorized original or archived research source, and failed or interrupted processing has a recoverable user path.

## Milestone 4 — Interactive 2D board

### Add

- performant canvas, frames, sticky notes, text, shapes, photo frames, markers, groups, stacks, labeled connectors, comments, timeline element, tasks, minimap, history, focus mode, and structured outline;
- licensed/source-aware online images, video, animation, attachments, and saved Web Research assets with explicit visual/research/evidence classification;
- AI ghost previews and approved layout actions;
- deterministic serialization, conflict handling, and realtime-ready operation model.

### Exit

Users can build, navigate, share, restore, and audit a meaningful board with keyboard-accessible alternatives and no loss under retry or concurrent edits.

## Milestone 5 — Source-backed AI copilot and research

### Add

- Ask, Analyze, Plan, Research, and Act modes;
- explicit context indicator and scope controls;
- evidence and legal-source citations;
- contrary material, unknowns, jurisdiction, and “current as of” disclosure;
- task, timeline, board, report, and document-request proposals;
- preview, approval, rejection, audit, and undo;
- shared Case AI and private AI threads;
- official-source-first web/legal research and saved research ledger.

### Exit

AI evaluations meet approved grounding, citation, injection-resistance, refusal, action-safety, latency, and cost thresholds. No model output can bypass authorization or directly overwrite accepted case material.

## Milestone 6 — Collaboration Room

### Add

- owner, admin, editor, reviewer, and guest roles;
- invitations, member management, presence, threads, mentions, reactions, pins, file previews, deep links, decisions, shared AI, unread summaries, and message-to-task/evidence/note actions;
- notifications and conflict-safe realtime updates.

### Exit

Two or more members can collaborate on the same case, recover from reconnects, and understand who changed what without cross-case leakage.

## Milestone 7 — Reports and professional review package

### Add

- case overview, chronology, evidence index, people/relationship summary, issue matrix, contrary material, open questions, task/decision history, and research ledger;
- review states, inclusion controls, redaction, previews, versioning, and PDF/document export;
- selective professional-review package.

### Exit

Exports are accurate, source-linked, permission-checked, accessible, and explicit about AI-derived, disputed, omitted, and stale content.

## Milestone 8 — Premium Find a Lawyer

### Add

- subscription entitlement;
- verified lawyer onboarding and license/jurisdiction records;
- profiles, filters, availability, pricing, languages, practice areas, remote/in-person mode, and verified reviews;
- consultation request, conflict-screening intake, selective case sharing, booking, payment, cancellation, refund, messaging, and status;
- marketplace moderation and operational administration.

### Exit

A premium user can find, compare, book, pay, selectively share, and review a verified professional with clear distinction between marketplace use, consultation, engagement, and formal representation.

## Milestone 9 — Release hardening

- signed builds, secure auto-update, crash recovery, backup/restore, observability, incident response, support operations, abuse prevention, payment reconciliation, data export/deletion, accessibility audit, penetration test, AI red-team, disaster recovery, legal review, and staged rollout.

## Deferred launch surface — promotional website

The website follows a stable, demonstrable application slice; it does not replace or delay core product delivery.

When its readiness gate is met, add:

- immersive but accessible product storytelling;
- truthful feature, AI, trust, marketplace, pricing, and availability pages;
- verified Windows/macOS downloads and release notes;
- product education, support, feedback, privacy, security, accessibility, and legal routes;
- reduced-motion and no-WebGL equivalents;
- privacy-safe analytics and a claims ledger; and
- performance, accessibility, security, content, browser, launch, and rollback gates.

See `docs/product/marketing-site-later.md`. Website visuals may use richer three-dimensional storytelling; this does not change the 2D application V1 decision.

## Explicit V1 exclusions

- native voice/video calls;
- WhatsApp, Discord, social-media, mailbox, call-log, or full-device connectors;
- background surveillance or automatic collection;
- 3D case environments;
- required sound effects;
- mobile applications;
- autonomous filing, messaging, booking, payment, deletion, or evidence mutation;
- unqualified worldwide legal-coverage claims; and
- outcome, guilt, liability, authenticity, or “win probability” predictions.

## Future candidates

Prioritize only after V1 usage and trust research:

- optional 3D board and spatial organization;
- restrained opt-in sound design;
- native audio/video consultation;
- selected cloud drive, email, messaging export, and evidence connectors;
- mobile companion and secure capture;
- advanced jurisdiction packs and licensed legal content;
- specialist multi-agent workflows behind one coherent user-facing copilot;
- richer entity/relationship and temporal analysis;
- enterprise policy, retention, SSO, and legal-hold controls; and
- professional filing or court integrations where legally and operationally justified.

## Roadmap rule

A future feature enters V1 only through an explicit scope decision that identifies the displaced work, new privacy/security obligations, user evidence, and revised exit criteria. “Competitive parity” alone is not sufficient justification.
