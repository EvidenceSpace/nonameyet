# EvidenceSpace UX quality bar

## Experience goal

EvidenceSpace should feel calm under pressure, powerful without intimidation, and trustworthy without looking bureaucratic. The product wins through coherence: every screen helps the user understand the case and take a justified next step.

## Design principles

### Clarity before spectacle

A user should identify the current case, current state, primary action, AI scope, and sharing visibility within seconds. 3D, sound, dramatic motion, and visual effects are Future enhancements and never compensate for unclear structure.

### Progressive disclosure

Keep the first surface simple. Reveal professional metadata, provenance, history, permissions, and advanced board controls when requested or contextually necessary.

### One system, adaptive language

Individuals and professionals use the same underlying objects. Adjust explanations, terminology density, and defaults—never the source quality or safety standard.

### Visible causality

When an upload becomes a card, a message becomes a task, or AI proposes a layout, the interface shows where it came from and what will change.

### Calm motivation

Use completion, orientation, and clear next steps. Do not use streaks, confetti for sensitive outcomes, fake countdowns, guilt, or adversarial gamification.

## Visual system direction

- Neutral, high-trust surfaces with restrained blue as the primary action/accent.
- Green only for completed/safe-positive states; orange for attention; red for destructive/error/risk.
- Never rely on color alone; pair with icon, label, shape, or position.
- Prefer borders and tonal surfaces before heavy shadows.
- Default radius around 8px; larger surfaces up to 12px. Pills only for compact statuses/tags.
- System sans typography, strong hierarchy, tabular numerals for dates/amounts, readable long-form measure.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Avoid glossy pseudo-3D cards, courtroom clichés, gavels, scales-of-justice decoration, fake legal seals, and generic AI sparkle overload.

The production design system must define and test tokens for light/dark themes, elevation, focus, density, typography, motion, canvas semantics, and exported reports.

## App-shell layout

- Global rail remains quiet and identifiable.
- Case navigation is distinct from global navigation.
- The board preserves a usable center area when drawers/panels open.
- AI, Properties, Comments, and Activity share the right-side context region rather than creating competing overlays.
- Essential actions remain available when the window narrows; panels collapse or overlay in a predictable order.
- Window title/breadcrumb, sync state, case membership, and AI scope remain visible without dominating content.

## Hierarchy and actions

- One primary action per view or dialog.
- Secondary actions look secondary.
- Destructive actions are separated from frequent actions and describe exact impact.
- AI actions use verbs and destinations: “Create 3 proposed tasks,” not “Do it.”
- Disable only when necessary; explain why and how to proceed.
- Avoid menus for the only important action.

## Board interaction quality

### Direct manipulation

- Objects follow pointer/stylus movement without visible lag on representative boards.
- Selection, drag, resize, rotate, connect, group, and frame behavior is consistent.
- Snapping is helpful, temporary, and bypassable.
- Auto-pan and zoom never trap the user.
- Accidental drags are recoverable through undo.

### Semantic clarity

- Evidence, research, entities, events, issues, tasks, AI findings, and visual-only elements are visually distinct.
- Suggested, accepted, disputed, stale, processing, and missing-source states are labeled.
- Semantic connectors show relationship labels; visual lines are not interpreted as evidence relationships.
- Selected object provenance and visibility are reachable within one interaction.

### Orientation

- Minimap, breadcrumbs/frame name, fit selection, search, focus lens, and return-to-last-location.
- Board chapters provide a readable presentation path.
- History identifies actor and action without overwhelming the canvas.

### Accessibility equivalent

- Structured outline/list mirrors object and connector semantics.
- Keyboard commands cover navigate, select, move, create, connect, edit, group, frame, and open details.
- Announce object count, selection, position changes, connection result, save/sync, and errors appropriately.
- Zoom and spatial arrangement are not required to access facts.

## Evidence and source viewing

- Original/derivative status and evidence limitations are explicit.
- Show hash and technical metadata progressively, not as default clutter.
- Source quote opens at exact page/region/time where possible.
- Processing progress reports stage and cancellation effect.
- Unsupported preview offers download or safe alternative.
- Redaction previews show what will be removed and warn about remaining metadata/attachments.

## AI interaction quality

- Context chip always states what AI can see.
- Shared/private visibility appears beside the composer and thread title.
- Answers distinguish assessment, source, contrary material, unknowns, and next step.
- Citations are easy to open without losing conversation location.
- Tool/research progress uses meaningful stages, not fake thinking text.
- Proposal preview shows affected objects and reversible/irreversible impact.
- Approval buttons never use dark patterns or prechecked external sharing.
- Correction and rejection are first-class; the interface does not shame disagreement.
- A failed AI call preserves the prompt/draft and offers retry, narrower scope, manual action, or support.

## Collaboration quality

- Presence supports coordination but does not create surveillance pressure.
- Message threads, board comments, tasks, and decisions each have a clear role.
- Conversions preview destination and visibility.
- Unread summaries link to original messages.
- Edited/deleted content and access changes do not leave misleading summaries.
- Notifications group noise and avoid case content on lock screens by default.

## Lawyer marketplace quality

- Verification scope/date and licensed jurisdictions are more prominent than marketing copy.
- Price, currency, duration, mode, availability, cancellation, fees, and sponsored status are visible before commitment.
- Filters are understandable and reversible.
- Ratings always show count and verified-booking basis.
- Booking flow makes conflict screening and selective sharing calm and explicit.
- Consultation, engagement, and formal representation are never visually collapsed into one step.
- Premium prompts never appear as fear-based legal urgency.

## Forms

- Visible labels; placeholders are examples only.
- Validate on blur/submit without attacking every keystroke.
- Preserve values on errors and restart where reasonable.
- Group related questions and explain why sensitive data is requested.
- Allow unknown/not sure where real cases commonly lack an answer.
- Date/time inputs preserve jurisdiction and time-zone meaning.
- Review step for case creation, sharing, booking, payment, and deletion.

## Empty, loading, partial, and error states

### Empty

Explain what belongs here, why it helps, and one first action. Offer starter layout/demo only when it will not contaminate a real case.

### Loading

Under roughly 100ms, avoid flicker. Longer work shows real stage/progress where available. Never animate text the user is trying to read.

### Partial

State what is available, what is missing, why, and whether continuing is safe.

### Error

State:

1. what happened in user terms;
2. what was saved;
3. what was not changed;
4. whether retry is safe; and
5. the next recovery/support action.

Raw exception text and unexplained status codes never replace user copy.

## Motion and sound

- Most UI transitions: approximately 150–250ms, tuned by observation.
- Animate transform/opacity before layout properties.
- Motion explains origin, destination, grouping, proposal preview, or status.
- Honor `prefers-reduced-motion` with an immediate equivalent.
- No looping decorative motion around evidence or allegations.
- V1 has no required sound. Future sounds are opt-in, subtle, semantic, volume-controlled, and never the only feedback.

## Accessibility requirements

- WCAG 2.2 AA target for application and reports.
- Semantic headings, landmarks, labels, descriptions, and errors.
- Full keyboard completion and visible focus.
- Logical focus order, modal trap/restore, Escape behavior.
- Meaningful live regions without announcement spam.
- Text contrast 4.5:1; large text and meaningful boundaries 3:1.
- Practical 44×44px targets.
- 200% zoom and text scaling; board outline when spatial reflow is impossible.
- Screen-reader and keyboard inspection on Windows and macOS accessibility stacks before launch.
- Captions/transcripts for audio/video content and non-audio alternatives for future sound.

## Content design

- Use direct, neutral, non-accusatory language.
- “The source states…” rather than “This proves…”.
- “Possible issue to review” rather than “You can definitely charge them with…”.
- Explain legal terms inline without hiding the professional term.
- Dates, currencies, numbers, names, and jurisdictions use locale-aware formats while preserving original values.
- Destructive and external actions name object count, recipient, retention, and reversibility.
- Avoid “AI magic,” “guaranteed,” “verified evidence,” “win,” and “best lawyer” unless literally and lawfully supported.

## Performance experience

Until measured budgets are approved, design for:

- immediate pointer/keyboard feedback;
- progressive rendering and virtualization for large libraries/conversations;
- board detail degradation before input lag;
- cancellable uploads, processing, research, and reports;
- optimistic UI only with deterministic rollback;
- visible reconnect/sync without blocking safe local drafting; and
- no unexpected full-case reload after a small action.

Every performance claim names device, OS, dataset/board size, network, build, percentile, and date.

## Visual QA protocol

For each changed surface, inspect relevant states at:

- Windows and macOS packaged builds when available;
- normal, narrow, maximized, and high-DPI windows;
- light/dark theme if supported;
- keyboard and reduced-motion modes;
- empty, realistic, and stress-sized data; and
- loading, errors, overlays, menus, focus, and permission changes.

Review for zero overlaps/overflow, adequate spacing, readable hierarchy, consistent alignment, intentional imagery, accessible contrast, and no hidden critical actions. Rendering or snapshots without human inspection are not a visual pass.