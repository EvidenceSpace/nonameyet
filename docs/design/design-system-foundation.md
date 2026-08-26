# EvidenceSpace design-system foundation

**Status:** visual and component direction for design review; tokens are proposed, not production commitments

## 1. Experience identity

### Working design language: “Case Room / Living Map”

EvidenceSpace combines two complementary environments:

- **Case Room:** warm, readable document surfaces that support concentration and trust.
- **Living Map:** a spatial layer that reveals relationships, time, sources, and proposals without becoming theatrical.

The application should look recognizable even without a logo because of four signature devices:

1. **Case Spine** — the restrained vertical case table of contents.
2. **Provenance Rail** — a narrow patterned edge on source-backed objects.
3. **Context Lens** — one stable right region for AI, properties, comments, and activity.
4. **Ghost Proposal** — translucent, bounded previews for AI-suggested changes.

Use these consistently; do not add decorative legal clichés or generic AI sparkles.

## 2. Color system

Colors are semantic roles, not decoration. Every state also uses text, icon, shape, or pattern.

### Light reading theme

| Token | Value | Use |
| --- | --- | --- |
| `ink-950` | `#10151D` | Primary text and darkest chrome |
| `ink-800` | `#29313D` | Secondary dark surface/text |
| `ink-650` | `#4B5565` | Secondary text |
| `ink-500` | `#687386` | Muted text that still passes required contrast by size/context |
| `paper-0` | `#FCFBF8` | Main reading canvas |
| `paper-50` | `#F4F2ED` | Secondary background |
| `surface` | `#FFFFFF` | Cards, menus, dialogs |
| `border` | `#D8DCE3` | Standard boundaries |
| `border-strong` | `#B9C0CC` | Selected/important boundaries |
| `signal-600` | `#3659D9` | Primary action and focus-compatible accent |
| `signal-700` | `#2948B9` | Hover/pressed primary |
| `ai-600` | `#6554C0` | AI identity and proposal outline |
| `confirmed-700` | `#187653` | User-confirmed/completed state |
| `provisional-700` | `#8A5A00` | Suggested/uncertain/needs review |
| `contrary-700` | `#B33A52` | Contradiction/contrary material |
| `danger-700` | `#B42318` | Destructive/error state |
| `research-700` | `#146C7E` | External research source |

### Dark focus theme

| Token | Value | Use |
| --- | --- | --- |
| `night-950` | `#0D1117` | Global Dock / deepest canvas |
| `night-900` | `#121821` | Main dark surface |
| `night-850` | `#18202B` | Raised surface |
| `night-750` | `#293445` | Borders/dividers |
| `night-text` | `#F2F4F7` | Primary text |
| `night-muted` | `#AFB8C7` | Secondary text |
| `signal-300` | `#9CACFF` | Primary accent on dark |
| `ai-300` | `#B6A9FF` | AI/proposal accent on dark |
| `confirmed-300` | `#6FD4A9` | Confirmed/completed |
| `provisional-300` | `#F0C16B` | Suggested/review |
| `contrary-300` | `#FF9AAF` | Contrary/conflict |

### Color rules

- Primary blue indicates an available user action, never AI authorship.
- AI violet indicates origin/scope/proposal, never correctness.
- Green means completed or user-confirmed, not legally verified.
- Red is reserved for errors, destructive impact, and explicit contradiction—not routine overdue work.
- Jurisdiction, case type, and evidence family do not receive arbitrary rainbow coding.
- Focus ring remains visible on every background and is never removed.

Contrast must be measured in implementation; these values are starting roles, not a substitute for automated and human checks.

## 3. Typography

### Proposed families

- **Interface:** system UI stack during prototype; evaluate Inter, Geist, or another highly legible variable sans before production.
- **Long reports and selected quotations:** optional Source Serif 4 or equivalent, only if cross-platform rendering and export remain stable.
- **Technical locators/hashes:** a restrained monospace stack.

### Scale

| Role | Size / line | Weight |
| --- | --- | --- |
| Display | 32 / 40 | 650 |
| Page title | 24 / 32 | 650 |
| Section title | 18 / 26 | 650 |
| Card title | 15 / 22 | 600 |
| Body | 14 / 21 | 400–450 |
| Compact UI | 13 / 18 | 450–550 |
| Caption | 12 / 17 | 450 |
| Micro label | 11 / 15 | 600, limited uppercase |

Rules:

- Body text does not fall below 13 px in the desktop app.
- Use tabular numerals for dates, times, amounts, counts, and hashes.
- Headings use sentence case.
- Avoid all-caps paragraphs and overly light font weights.
- Limit long-form reading to approximately 68–78 characters per line.

## 4. Geometry and density

### Spacing

Base scale: `4, 8, 12, 16, 24, 32, 48, 64`.

- 4: icon/text correction and compact clusters.
- 8: controls and related metadata.
- 12: compact card interior.
- 16: standard component padding.
- 24: card/section separation.
- 32+: page structure.

### Radii

- 4 px: tiny status/selection details.
- 8 px: controls, cards, drawers.
- 12 px: large briefing/proposal surfaces.
- 16 px: rare onboarding/authentication hero surfaces.
- Full pills: statuses, compact filters, avatars only.

### Borders and elevation

- Prefer 1 px borders and tonal contrast over shadows.
- Menus/dialogs use one soft shadow; evidence cards do not float dramatically.
- Selected board objects use a 2 px semantic outline plus handles.
- AI ghost proposals use dashed or patterned outlines, never a “magic glow.”

### Density modes

- **Comfortable** default for individuals and mixed audiences.
- **Compact** optional for professional users, affecting lists/tables and metadata—not button targets, typography legibility, or confirmation clarity.
- Density is a user preference, never inferred from role.

## 5. Iconography and imagery

### Icons

- 1.75–2 px optical stroke, rounded joins, simple geometry.
- Filled variants only for active navigation or urgent state.
- Every icon-only control has a tooltip and accessible label.
- AI icon should suggest a lens or structured nodes—not stars/sparkles.
- Evidence icon should not imply legal acceptance.

### Imagery

- Product surfaces prioritize real UI and synthetic evidence examples.
- Avoid gavels, scales, court columns, police tape, fingerprints, and sensational crime imagery.
- Avatars are optional and never used to infer professional status.
- Empty states use minimal diagrams or line illustrations, not decorative stock art.

## 6. Semantic object language

Every board object has four readable layers:

1. **Family shape/icon** — what kind of object it is.
2. **State label** — confirmed, suggested, disputed, processing, stale, missing source.
3. **Provenance Rail** — whether and where it is source-backed.
4. **Visibility marker** — private, selected members, case, consultation package.

### Object families

| Family | Base form | Distinguishing treatment |
| --- | --- | --- |
| Evidence | Document/media card | Solid provenance rail and original/derivative label |
| Research | Reference card | Teal rail, publisher/jurisdiction/date row |
| Entity | Compact identity node | Circular/portrait anchor with entity type |
| Event | Horizontal date card | Date confidence marker and source count |
| Issue track | Framed structured card | Requirements, support, contrary, unknown counts |
| Task | Checklist card | Status, owner, deadline, requested item |
| AI finding | Bounded analysis card | Violet origin label and provisional state |
| Visual note | Plain sticky/text/shape | No provenance rail or evidence badge |
| Timeline | Wide structured component | Scale, event confidence legend, filters |

Color is never the only distinction.

## 7. Core components

### Navigation

- Global Dock item.
- Case Spine item and nested pinned item.
- Breadcrumb with safe truncation.
- Command palette result grouped by scope and type.
- Tab set for Context Lens.

### Actions

- Primary, secondary, quiet, danger, and split-button variants.
- Icon button with tooltip.
- Contextual mini-toolbar.
- Protected-action review footer.
- AI proposal approve/edit/reject group with equal access to reject/edit.

### Status

- Status label with icon/text.
- Sync and reconnect indicator.
- Processing stage indicator.
- Visibility chip.
- Source/research authority label.
- Permission state.
- Deadline confidence state.

### Content

- Situation Brief.
- Next Recommended Step.
- Organization dimension.
- Evidence card and source citation.
- Contrary-material block.
- Unknown/open-question block.
- Task row.
- Message/thread.
- Decision record.
- Lawyer result/service card.

### Overlays

- Tooltip.
- Popover.
- Drawer/Context Lens overlay.
- Command palette.
- Dialog.
- Full protected-action review.

Only one modal layer is active at a time. Nested dialogs are prohibited.

## 8. Interaction states

Every interactive component specifies:

- rest;
- hover where pointer exists;
- focus-visible;
- active/pressed;
- selected;
- disabled with reason when discoverable;
- loading/progress;
- success/confirmed;
- warning/provisional;
- error/failed;
- read-only/permission lost; and
- stale/conflicted where relevant.

Optimistic state must show pending status and deterministic rollback. A spinner cannot replace preserved user input or explain what happened.

## 9. AI visual language

AI is visually distinct but integrated.

- Violet identifies AI origin/scope, not authority.
- The Context Lens header states mode, context, and visibility.
- Answers use stable sections: Assessment, Why, Evidence, Contrary, Unknowns, Next step.
- Citations look like source links, not decorative chips.
- Research/tool progress uses named stages.
- Proposed board changes use ghost objects and a bounded proposal frame.
- Proposed text changes use a readable before/after diff.
- Approval area lists count, destination, visibility, reversibility, and external impact.
- Accepted AI-derived content changes to the destination’s normal style while retaining origin/audit metadata.

Avoid typing simulations, fake thought text, pulsing magic gradients, and anthropomorphic “the AI is thinking” behavior.

## 10. Collaboration visual language

- Presence uses small avatars/dots near the relevant page or object only when useful.
- Cursors are optional, fade quickly, and can be hidden.
- Authorship appears in history, messages, comments, decisions, and proposals—not on every static card.
- Unread counts are grouped and capped visually.
- Role and visibility are shown at the action boundary.
- “Since you were away” is a source-linked summary, not an algorithmic social feed.
- Solo mode uses the same components without placeholder avatars or pressure to invite.

## 11. Empty and recovery patterns

An empty state contains:

1. what belongs here;
2. why it helps;
3. one primary first action; and
4. an optional safe alternative.

An error/recovery state contains:

1. what happened;
2. what was saved;
3. what was not changed;
4. whether retry is safe; and
5. the next action/support path.

Do not clear forms, board selections, report drafts, or Room drafts after recoverable failure.

## 12. Accessibility foundation

- WCAG 2.2 AA target.
- Visible focus with at least 2 px effective indicator and sufficient contrast.
- Full keyboard completion.
- Logical reading/focus order independent of visual position.
- 44 × 44 px practical targets for primary touch/pointer controls; compact desktop controls retain adequate spacing and accessible alternatives.
- 200% text zoom; Board uses structured Outline when spatial reflow is impossible.
- Screen-reader names include object type, title, state, visibility, and source status where relevant.
- Live regions announce save/sync, object creation, connection result, proposal result, and errors without flooding.
- Reduced motion removes spatial transitions while preserving state change.
- High-contrast/system-forced-colors behavior is designed, not patched later.

## 13. Token implementation rules

- Tokens use semantic names (`action-primary`, `status-provisional`) rather than palette names (`blue-500`) at component boundaries.
- Themes swap tokens, not component-specific hex values.
- Canvas object semantics have dedicated tokens and patterns.
- Report/export tokens remain printable and do not inherit dark app chrome.
- Desktop native title-bar and focus behavior are tested on both Windows and macOS.
- No token enters production until contrast, localization, scale, and representative component screenshots are reviewed.
