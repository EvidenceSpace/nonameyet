# EvidenceSpace connected experience contract

Status: design review artifact; not production implementation.

## Stable global layer

The global rail has exactly these primary destinations:

1. Home
2. Cases
3. New case
4. Lawyers
5. Notifications
6. Security/help
7. Settings
8. Account

A dedicated route replaces the content inside its own application frame. It must not masquerade as a drawer over a different page. The global Bell is the only place that carries an unread count.

## Entry journey

`Welcome/authentication → Profile → Legal context → Guidance → Accessibility → First case → Global Home`

Profile, legal defaults, guidance, and accessibility remain editable in Settings. The first story does not: it belongs to the New Case Story Field.

## Case workspace

Every active case uses one stable lens bar:

`Brief → Space → Evidence → Research → Work → Room → Reports`

Research is a first-class lens everywhere. Changing lenses must not duplicate or silently transform case objects.

## Exact-object continuity

An object keeps the same identifier, source, provenance, access rules, backlinks, comments, and history receipt wherever it appears. Example:

`Evidence E-04 → Brief claim → Space relation F-03 → Work task W-01 → Room thread → Report citation → Notification → Workspace-history receipt`

Links open the exact object, not only the destination page.

## AI action contract

AI may observe workspace context, explain, research, and propose. A proposed mutation is visibly provisional until approved. Review must show sources, destination, audience, effect, uncertainty, and recovery. Approval creates a separate human-authored history event. Contrary material remains visible.

## Marketplace contract

`Discover → Lawyer profile → Booking → Payment → Selective sharing`

Payment never grants case access. Selective sharing requires explicit items, permission, audience, expiry, download policy, and a final review. Revocation records a history receipt.

## Notification return path

`Badge → compact in-app or privacy-safe Windows toast → large drawer → View all → exact object`

Opening a notification preserves the originating object, case, and backlinks.

## Governance

Workspace membership is separate from case access. Workspace history is a first-class destination. Events are append-only; corrections create follow-up events. Undo may reverse an effect without erasing its receipt. Private values remain masked for unauthorized viewers.

## Accessibility and motion

Keyboard navigation, visible focus, reduced motion, readable contrast, and screen-reader labels are required. Motion clarifies state and spatial continuity; it never hides state, blocks input, or becomes the only source of meaning.
