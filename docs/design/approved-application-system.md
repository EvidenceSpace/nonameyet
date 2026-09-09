# Approved EvidenceSpace application system

**Status:** approved design foundation, clarified 9 September 2026  
**Scope:** target application placement, continuity, behavior, visual language, and implementation debt  
**Not evidence of:** implemented desktop, cloud, AI, collaboration, payment, or marketplace behavior

## Approval interpretation

The user approved the main design and idea after a page-by-page review and a connected end-to-end prototype. Small errors remain in some bars, tabs, active states, and route connections. Fix them during component implementation and visual QA; do not use them to reopen the product into a generic dashboard or a different aesthetic.

## 9 September 2026 fidelity clarification

The approved [`../../design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html`](../../design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html) is the visual and workflow source of truth. **Refine, do not redesign.** A technically clean replacement shell is still wrong if it no longer looks and feels like this approved system.

Required interpretation:

- preserve the recognizable palette, light atmospheric background, floating geometry, navigation model, page composition, density, and connected-object behavior;
- improve blank or underused areas with purposeful hierarchy, progress, source-linked content, stronger composition, and restrained interaction—not generic explanatory cards;
- use simple, familiar, human language; remove copy before adding helper text;
- avoid oversized headings, long introductions, repeated explanations, decorative gradients, excessive glass treatment, generic AI sparkle motifs, AI-generated imagery, and animation everywhere;
- use motion only to explain origin, destination, state, continuity, or recovery;
- inspect the exact source screen before coding and compare the implementation beside it before review; and
- record any intentional visual departure with the user or accessibility/performance evidence that justified it.

The goal is an intentionally human-designed professional product, not a template-like dashboard and not an imitation of a competitor.

## Experience principles

1. Broad but not congested.
2. One dominant purpose per page.
3. Stable shell plus canonical-object continuity.
4. Light-first calm clarity; explicit dark support.
5. Source, contrary material, uncertainty, visibility, and AI state stay visible.
6. AI proposes; people decide.
7. Engaging through progress, craft, recovery, and useful collaboration—not streaks or artificial urgency.
8. Every spatial interaction has a keyboard/structured equivalent.
9. Prefer visual communication and concise labels over explanatory prose.
10. Preserve the approved character while resolving measurable usability defects.

## Shell

- Floating rail: 22px inset, 68px width, 25px radius.
- Top bar: 108px left, 22px right/top, 68px height, 24px radius.
- Main frame: 108px left, 22px right/bottom, 106px top, 30px radius.
- Primary active treatment: blue gradient around `#4D70F7` with restrained shadow.
- Contextual top bar changes for dedicated routes; overlay drawers preserve origin.
- Case tabs are exactly Brief, Space, Evidence, Research, Work, Room, Reports.

Geometry is a reference. Accessibility, localization, high DPI and narrow windows may require tokenized reflow.

## Visual identity

- Ink: `#172033` / `#162034`
- Primary blue: `#4D70F7` / `#4368F5`
- Secondary blue: `#6B8BFF`
- AI violet: `#8267EF` / `#8666F4`
- Confirmed/research teal: `#22A589` / `#24A98B`
- Contrary coral: `#E65D72` / `#E76577`
- Uncertainty amber: `#D99A35` / `#E5A33D`

Semantic state never relies on color alone. Avoid platform emoji as core iconography. Use a consistent vector icon family and text labels where ambiguity matters.

## Approved surfaces

- Welcome, authentication and recovery
- Five-page onboarding
- Global Home
- Cases Library
- New Case Story Field
- Brief
- Space
- Evidence
- Research
- Work
- Room
- Reports
- Find a Lawyer
- Lawyer Profile
- Booking, Payment and Selective Sharing
- Notification lifecycle
- Complete Settings system

See `../product/page-and-feature-matrix.md` for implementation detail and `../../handoff/APPROVED-SCREEN-CATALOG.md` for the exact screenshot routes.

## Signature patterns

### Case continuity ribbon

Case and object context survives lens changes. Deep links return to the exact object, and cross-lens links show their destination and preserve a backlink when useful.

### Space relation

Board cards reference domain objects. Connectors are typed and labeled. A visual line is not evidence or an accepted relationship. Copying a card does not duplicate or grant access to the source.

### Context Lens

AI, Properties, Comments, and Activity appear contextually rather than as permanent competing dashboards. The panel discloses current selection and AI visibility.

### Ghost Proposal

AI board/work/report changes render as provisional ghosts or proposal cards marked NOT APPLIED. Review shows destination, visibility, sources, impact, and recovery before approval.

### Workspace receipt

Approval, rejection, execution, failure and undo are separate attributable events. Undo reverses effect; it does not erase history.

## Board precision contract

- photo frames, evidence cards, research cards, sticky notes, task cards, frames, pins and connectors use crisp shared anchors;
- connector endpoints remain attached during drag, zoom, group and frame movement;
- relationship type is reviewed before acceptance;
- timeline is a resizable Board element, not a hidden separate system;
- selected object and right inspector agree;
- source-backed assessment separates support, contrary material and unknowns;
- AI ghost retains Reject, Edit, Approve and safe Undo where possible;
- target animation is 60 FPS; drag lift 120ms, pin snap 140ms, focus 160ms, connector draw 180ms; and
- reduced motion uses immediate/opacity state changes while preserving causality.

## Notification contract

Badge count → focused in-app toast or privacy-safe OS notice → origin-preserving drawer → View All route → exact object and backlink. Settings controls delivery only. Normal toast target is eight seconds; critical notices persist until dismissed or opened; maximum stack three; reduced motion is opacity-only.

## Settings contract

System follows the OS theme. Explicit Light/Dark disables automatic switching. Onboarding preferences have durable homes except the first Story Field. Workspace history is first-class. Notification settings never display unread count.

## Synthetic continuity fixture

The review uses C-03, E-04, R-02, F-03, W-01, Thread 15, RP-01 and B-07 to prove connectedness. Example Work counts (`6 open`, `3 need you`, `1 AI proposal`, `4 connected lenses`) are fixture QA values, not business rules.

## Accepted implementation debt

- unify global/case top-bar ownership;
- normalize active rail/tab state and spacing;
- repair inaccurate hotspot/return connections from the review artifact;
- validate overlays vs dedicated routes;
- reduce copy and heading scale where the prototype feels dense;
- make underused areas useful without adding filler;
- finish Board and notification motion studies;
- inspect high-DPI, narrow, maximized, restored, System, Light and Dark states;
- create tokenized components instead of copying screenshot coordinates;
- replace fixture values with domain selectors; and
- complete accessibility/assistive-technology review.

## Change control

A scoped design adjustment is allowed when user feedback, usability research, accessibility, platform behavior, performance, security, legal safety, or implementation evidence supports it. Record the reason, alternatives, affected surfaces, migration, and visual-regression update. “Another app does it” or “vibecoded apps look like this” is not sufficient.