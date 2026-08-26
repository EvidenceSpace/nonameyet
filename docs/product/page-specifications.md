# EvidenceSpace page specifications

## How to use this document

This is the canonical V1 page contract. Each implementation slice must identify the page and states it changes, update this document if behavior changes, and add tests at the appropriate layer.

Each page must provide:

- a clear purpose and one dominant primary action;
- loading, empty, populated, partial, permission-denied, error, reconnecting, and large-data states where relevant;
- keyboard access, visible focus, screen-reader labels, reduced motion, and zoom/reflow support;
- honest current/suggested/confirmed/shared/private status;
- recoverable drafts for user-authored content; and
- permission-checked deep links.

## 1. Welcome and authentication

### Purpose

Explain the product clearly and establish a secure account session without making unimplemented or legal-outcome claims.

### Sections

- EvidenceSpace mark, concise promise, and trust statement.
- Sign in, create account, and account recovery.
- Windows/macOS version and update status when relevant.
- Privacy, terms, accessibility, support, and service status links.
- A safe demo-case option may be added after onboarding foundations exist.

### Primary action

Create account or sign in.

### Required states

Authentication provider unavailable, wrong/expired link, account locked, consent required, application update required, no network, and retry.

### V1 acceptance

A user can authenticate, recover, return to the intended location, and understand that AI assistance is not a licensed professional relationship.

## 2. Adaptive onboarding

### Purpose

Set defaults that improve the experience without excluding any user type.

### Steps

1. **Welcome and goal** — why the user is trying EvidenceSpace.
2. **Working mode** — own matter, client matter, investigation/review, learning/teaching, or organization.
3. **Location and jurisdiction defaults** — country, state/region, language, and time zone.
4. **Experience preference** — plain-language explanations, professional terminology, or adaptive.
5. **Profile** — display name, optional organization, role, and avatar.
6. **Accessibility and notifications** — motion, contrast, text size, keyboard hints, reminder channels.
7. **Privacy and AI explanation** — what case members and AI may access, with links to details.
8. **First action** — create a case, open a demo, or join an invitation.

### Rules

- All defaults remain editable.
- Role is personalization, not proof of professional status.
- Country/state selection does not imply full legal coverage.
- Skip is available for nonessential fields.
- Progress persists across restart.

### V1 acceptance

The user finishes with a valid profile and an obvious next action in a few focused steps, without being forced to upload sensitive material.

## 3. Global Home

### Purpose

Orient the user across workspaces and cases and surface the most valuable next action.

### Sections

- Greeting and workspace switcher.
- Continue working: recent cases and last board location.
- Assigned to me: tasks, deadlines, approvals, and mentions.
- Case health notices: failed processing, stale analysis, access changes, or pending deletion—not outcome predictions.
- Recent collaboration activity.
- Upcoming lawyer consultations.
- Plan/storage/AI usage only when actionable and not used as pressure.
- Create case and join/invite status.

### Primary action

Continue the highest-priority user-controlled action, with the reason shown.

### Empty state

Explain the case workflow and offer Create first case, Open demo case, or Accept invitation.

### AI behavior

The global assistant may explain the product and summarize authorized cross-case notifications. It does not automatically combine case content across matters.

## 4. Cases library

### Purpose

Find, create, organize, archive, and manage cases.

### Sections and controls

- Search by title, authorized member, tag, jurisdiction, and case type.
- Filters for active, archived, shared, owned, assigned, and recently viewed.
- List/grid toggle with accessible list as the baseline.
- Case card: title, type, jurisdiction, organization progress dimensions, next task, last activity, members, and processing alerts.
- Bulk actions limited to safe, permission-checked operations.
- Archived and pending-deletion views.

### Primary action

New case.

### Rules

- No “win chance” or unlabeled AI score.
- A case title is not leaked before access is granted.
- Archive is reversible; permanent deletion is deliberate and separately confirmed.

## 5. New case and AI-guided intake

### Purpose

Create a useful initial case structure while minimizing intimidating form work.

### Flow

1. Case title or temporary private label.
2. User describes the situation in their own words.
3. AI asks only high-value clarifying questions.
4. User confirms people/organizations, location, dates, case category, jurisdiction, objective, and known deadlines.
5. AI proposes issue tracks, evidence categories, initial tasks, and a starter board layout.
6. User reviews what is fact, assumption, unknown, or suggestion.
7. Case is created; nonessential questions remain as open items.

### Required controls

- Save and resume.
- Skip unknown questions.
- Edit jurisdiction and case type.
- Mark content as sensitive/private where supported.
- Review AI-generated structure before creation.
- Start blank instead.

### Failure behavior

User narrative and confirmed answers remain as a draft if AI or storage fails. AI failure cannot block manual case creation.

## 6. Case Home

### Purpose

Provide the overall situation, honest organization progress, and the next recommended step.

### Header

- Case title, case type, jurisdiction, status, owner, members, last activity.
- Share/invite, search, more actions, and Find a Lawyer.
- Visible AI-context and synchronization status.

### Main sections

1. **Situation summary** — user-editable overview with source-backed AI draft status.
2. **Next recommended step** — one action, reason, source basis, and alternatives.
3. **Progress dimensions** — evidence processed, pending reviews, unresolved contradictions, open questions, tasks, deadlines, and research freshness.
4. **Issue tracks** — possible charges/claims/defenses/remedies appropriate to case type, always provisional unless user-accepted.
5. **Evidence gaps and requests** — requested item, why it matters, owner, deadline, and status.
6. **Upcoming deadlines** — source, jurisdiction, confidence, reminder, and human-review warning.
7. **Tasks** — priority, assignee, status, deadline, instructions, related evidence/issue.
8. **People and organizations** — compact structured summary generated from accepted objects.
9. **Recent activity and decisions** — member and AI actions with audit links.
10. **Latest AI briefing** — generated on demand or when material state changes, never silently treated as current forever.

### Progress rule

Any percentage is based on a disclosed checklist or task plan. The page must never display likelihood of winning, guilt, authenticity, or legal strength.

## 7. Board

### Purpose

Provide the primary visual environment for arranging and connecting case material.

### Page regions

Defined in [`board-and-ai-copilot.md`](board-and-ai-copilot.md): top toolbar, left tool rail/library drawer, center canvas, right context panel, and bottom controls.

### Required V1 object types

Evidence card, research source, person/entity, event, issue track, task, sticky note, text, image frame, shape, frame/chapter, group/stack, timeline, and labeled connector.

### Primary action

Add or organize case material; the active tool determines the immediate action.

### Required states

New blank board, starter template, large board, selection, multi-selection, read-only, lost permission, reconnecting, conflict resolution, failed upload, failed save, historical snapshot, and AI proposal preview.

### Accessibility

Every board object and connection appears in an equivalent structured outline with reorder, edit, connect, and navigate commands. Keyboard users can pan, zoom, select, move, create, label, and inspect without pixel-perfect pointer input.

## 8. Evidence detail and source viewer

### Purpose

Inspect the original, derivatives, metadata, extracted text, source locators, links, processing, permissions, and history for one evidence item.

### Sections

- Original preview or explicit unsupported-preview state.
- Filename/title, media type, size, hash, owner/uploader, collection method, captured date, uploaded date, source URL, and retention status.
- Processing timeline: validation, malware scanning, extraction/OCR/transcription, warnings, retries, cancellation.
- Extracted text with page/time/region locators.
- Accepted facts/events and provisional AI findings linked to the item.
- Board appearances and related objects.
- Comments, versions, access, and audit history.
- Download original, create redacted derivative, replace metadata, archive, and delete according to permission.

### Rules

- Editing metadata never mutates original bytes.
- “Evidence” is an organizational label, not authenticity or admissibility certification.
- Broken or stale provenance fails closed and is repairable.

## 9. Web Research

### Purpose

Research external facts or law, preserve a reviewable source ledger, and add selected results to the case.

### Sections

- Research question and scope.
- Jurisdiction, date range, source-type, and official-source filters.
- Active research steps and cancellation.
- Results grouped as primary law/official, court decisions, official guidance, reputable secondary sources, and general web.
- Result preview with title, publisher/court, author, URL, published/updated/accessed dates, excerpt, and limitations.
- Save to case, cite in AI response, add to board, compare, or dismiss.
- Research history: query, filters, sources reviewed, saved items, AI summary, and user decisions.

### Rules

- Search results are not evidence until deliberately captured with provenance.
- AI summaries never replace the source.
- Source hierarchy and jurisdiction are visible.
- Dynamic or removed pages retain an archived representation where lawful and technically supported.

## 10. Room

### Purpose

Give authorized members a durable shared place to discuss, decide, assign, and coordinate around the case.

### Sections

- Channels/topics: General, Evidence, Research, Tasks, and user-created topics where permitted.
- Threaded messages, mentions, reactions, pins, bookmarks, attachments, and board deep links.
- Shared Case AI thread.
- Decision log and action-item view.
- Member list, presence, typing, and role.
- Search and unread summary.

### Message actions

Convert to task, sticky note, evidence candidate, research question, decision, or report note. Every conversion previews destination and visibility.

### V1 boundary

Text chat and optional recorded voice messages may be considered; native live audio/video calling is Future.

## 11. Reports

### Purpose

Assemble reviewed, source-linked outputs without hiding omissions, disputes, or AI involvement.

### Report types

- Case overview.
- Chronology.
- Evidence index.
- People and relationship summary.
- Issue/charge/claim matrix.
- Contrary-material and contradiction report.
- Missing-evidence and open-question report.
- Tasks and decision history.
- Research ledger.
- Lawyer consultation package.

### Builder sections

Template, date/version, included sections, evidence filters, redaction, member/private-content review, citation style, preview, approval, export, and share history.

### Rules

- AI creates a draft, not a final filing.
- Stale, unresolved, private, or permission-restricted material is excluded or prominently disclosed.
- Every included claim retains reachable provenance.
- Export performs a fresh permission and source-integrity check.

## 12. Find a Lawyer

### Purpose

Allow Premium users to discover and compare verified lawyers appropriate to location, legal need, language, budget, and availability.

### Sections

- Search and AI-assisted filter setup.
- Filters: licensed jurisdiction, practice area, language, consultation mode, availability, price, experience, and verified rating.
- Result cards: verification, name, practice areas, jurisdictions, languages, price, next availability, rating, completed verified consultations, and sponsored label if applicable.
- Saved lawyers and recent searches.
- Upcoming and past bookings.
- Matching-support request when no result exists.

### Rules

- AI may recommend criteria, not secretly choose based on paid placement.
- Subscription access and lawyer consultation price are separate.
- Emergency or safety-critical resources are not hidden behind Premium.

## 13. Lawyer profile

### Purpose

Help the user make an informed comparison.

### Sections

- Verified identity and professional image.
- Bio, practice areas, jurisdictions/licenses and verification dates.
- Languages, experience, consultation modes, location/time zone.
- Services, duration, price, availability, response time, and cancellation terms.
- Verified reviews and lawyer responses.
- Disclosure of sponsored/promoted status.
- Report profile, save, share, and book.

### Rules

A marketplace profile is not EvidenceSpace endorsement. License status requires periodic revalidation and jurisdiction-specific disclosure.

## 14. Booking and consultation

### Purpose

Book a consultation while protecting confidentiality, conflicts, consent, and user control.

### Flow

1. Select service and time.
2. Provide a limited matter description.
3. Complete conflict-screening questions.
4. Select information to share.
5. Preview the exact consultation package.
6. Review price, taxes, cancellation, refund, and marketplace terms.
7. Pay and confirm.
8. Track lawyer acceptance, questions, reschedule, cancellation, and consultation access.
9. After completion, leave a verified review.

### States

Requested, conflict review, awaiting lawyer, accepted, payment pending, confirmed, reschedule requested, cancelled, refunded, completed, disputed, and no-show.

### Rules

Consultation, engagement, and formal representation are separate. The complete case is never shared automatically.

## 15. Notifications

### Categories

Mention, reply, task assignment, deadline, AI proposal approval request, processing failure, access change, report ready, lawyer message, booking update, payment/refund, security, and system status.

### Rules

- Group repetitive events.
- Provide destination and actor without exposing sensitive content on the operating-system lock screen.
- Support per-case and per-category preferences.
- Security and access notifications cannot be silently disabled when required.

## 16. Profile, workspace, case settings, billing, and support

### Profile

Name, avatar, working mode, language, time zone, terminology preference, accessibility, notifications, sessions, export, and account deletion.

### Workspace settings

Name, members, roles, invitations, default retention, supported jurisdiction policy, billing, audit access, and deletion/transfer.

### Case settings

Title, classification, jurisdiction, members, roles, retention, AI access, archive, export, and permanent deletion.

### Billing

Plan, entitlements, usage explanation, invoices, payment methods, cancellation, and lawyer fees shown separately.

### Help and support

Searchable product guidance, AI product-help mode, contact support, report bug, feedback, feature request, service status, privacy request, and human escalation.

## Cross-page acceptance checklist

Before a page is considered V1-ready:

- one dominant purpose and primary action are evident;
- all data is permission scoped;
- every AI state is visibly provisional or accepted;
- user input survives recoverable failure;
- empty/loading/partial/error/reconnect/read-only states are designed;
- keyboard, focus, screen-reader, color, motion, zoom, and contrast checks pass;
- deep links restore location safely;
- analytics avoid case content;
- desktop window resizing does not hide essential actions; and
- documentation, tests, and observed behavior agree.