# EvidenceSpace information architecture

**Status:** Target V1; application design approved 30 August 2026.

## Structural principle

EvidenceSpace is broad, not crowded. Each surface has one dominant purpose; canonical objects, backlinks, contextual peeks, and a stable shell connect the experience. Do not solve complexity by placing every feature on one page.

## Global shell

### Floating rail

At normal desktop widths:

1. Global Home
2. Cases
3. New Case
4. Find a Lawyer
5. Notifications / global Bell
6. contextual spacer
7. security/privacy status when actionable
8. Settings
9. account avatar

Unread counts appear only on the global Bell. Settings → Notifications is configuration and has no unread badge.

### Context-aware top bar

Global pages show workspace and page context. Case pages show the active case and the seven case lenses. Overlay drawers preserve the originating page; dedicated routes own their own contextual top bar. Native window controls remain the desktop shell’s responsibility.

### Main frame

Normal reference geometry:

- rail: left/top/bottom 22px, width 68px, radius 25px;
- top bar: left 108px, right/top 22px, height 68px, radius 24px;
- main frame: left 108px, right 22px, top 106px, bottom 22px, radius 30px.

These values are design references, not hard-coded accessibility limits. The shell must reflow, preserve focus, and remain operable at constrained widths and high DPI.

## Access and first run

1. Welcome
2. Create account / sign in
3. Recovery and security paths
4. Profile
5. Legal context
6. Guidance preferences
7. Accessibility preferences
8. First-case readiness
9. Global Home

Account creation comes before nationality/jurisdiction. Progress represents separate pages. The first story is entered in New Case, not in Settings.

## Global destinations

### Global Home

Cross-case progress, urgency, recent work, synchronized state, recommended next actions, and quick starts. It is not a second Case Brief.

### Cases

Searchable/filterable case index with active, archived, invitation, safe deletion, and create-case paths.

### New Case — Story Field

A narrative work surface with user-owned draft, structured AI extraction, high-value questions, manual fallback, jurisdiction/classification review, and create-case approval. It is intentionally not a generic permanent chat box.

### Find a Lawyer

Premium discovery with Discover, Saved, and Bookings. Profile, booking, payment, and sharing remain distinct states.

### Notifications

Bell → focused-app toast or privacy-safe OS notification → origin-preserving drawer → View All route → exact object → backlink.

### Settings

Account:
- Profile & identity
- Legal & regional defaults
- Personalization: appearance and accessibility
- AI & guidance

Attention and privacy:
- Notifications
- Privacy & sharing
- Security

Workspace:
- Workspace & members
- Connections
- Workspace history

Plan and support:
- Billing
- Help & support

## Case shell

Every case uses these first-class lenses in this exact order:

1. **Brief** — reviewed understanding, overall situation, organization progress, next step, deadlines, unknowns, activity.
2. **Space** — 2D board, source-backed objects, semantic connectors, timeline, tasks, comments, history, AI ghost proposals.
3. **Evidence** — originals, derivatives, metadata, source locators, integrity, review, permissions, backlinks.
4. **Research** — official-source-first legal/factual research, saved excerpts, authority/freshness, research ledger.
5. **Work** — tasks, requested information, status, priority, assignee, deadline, instructions, source context.
6. **Room** — human-first messages, threads, decisions, pins, presence, deep links, shared Case AI.
7. **Reports** — reviewed, versioned, source-linked outputs, redaction, export, professional package.

Evidence and Research are separate. Work is not hidden inside Room. The AI is contextual; it does not become an eighth case destination.

## Canonical object continuity

A case, evidence item, research source, board relation, task, thread, report, notification, lawyer, and booking each have a permission-checked durable identity. Opening from another lens preserves:

- workspace and case;
- exact object and relevant sublocation;
- source/relationship context;
- origin/backlink where useful;
- visibility and approval state;
- safe request-access path without leaking restricted titles/content.

Synthetic design fixture continuity uses C-03, E-04, R-02, F-03, W-01, Thread 15, RP-01, and B-07. These identifiers are examples, not production constants.

## Appearance

- System + OS Light → Light, automatic switching on.
- System + OS Dark → Dark, automatic switching on.
- Light → Light, automatic switching off.
- Dark → Dark, automatic switching off.

## Empty-state primary actions

- Home with no cases → Create first case.
- Cases empty → Create or accept invitation.
- New Case → Start the Story Field manually or with guided prompts.
- Brief without evidence → Add evidence or record an open question.
- Space empty → starter frame, upload, or blank board.
- Evidence empty → add original, URL, or text source.
- Research empty → begin sourced research.
- Work empty → create task or review an AI proposal.
- Room empty → invite authorized member or start thread.
- Reports empty → inspect prerequisites and create draft.
- No lawyer results → adjust filters or show permitted external resources.

## Responsive rule

Never shrink the canvas below a useful minimum to keep both side panels open. At constrained widths, one panel overlays; closure restores focus. The board always has an equivalent structured outline.
