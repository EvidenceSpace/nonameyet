# EvidenceSpace motion, attention, and engagement specification

**Status:** design contract; no animation or sound behavior is implemented by this document

## 1. Purpose

EvidenceSpace should remain useful across months of solo or team case work without manufacturing addiction. Motion and engagement patterns must improve comprehension, continuity, trust, and completion.

The product should make users want to return because:

- they can resume instantly;
- the workspace gets clearer as they work;
- sources and uncertainty remain trustworthy;
- small actions produce visible organization progress;
- collaboration reduces coordination cost; and
- AI offers justified next steps without taking control.

It must not rely on streaks, variable rewards, fear, social comparison, manipulative urgency, or celebratory treatment of legal conflict.

## 2. Engagement model

### 2.1 Orientation

Every return starts with:

- last meaningful location;
- what changed;
- what needs attention;
- what remains safe/saved; and
- one recommended next action with a reason.

This replaces a feed optimized for consumption.

### 2.2 Visible organization progress

Progress is shown as separate, explainable dimensions:

- evidence processed;
- review queue;
- unresolved contradictions;
- open questions;
- tasks completed/remaining;
- deadlines reviewed;
- research freshness; and
- report readiness.

Never combine these into a case-strength, win, guilt, liability, or authenticity score.

### 2.3 Completion

Completing a meaningful action may produce:

- a brief check transition;
- updated dimension count;
- a calm “Saved to…” destination message;
- the next available step; and
- an undo path where safe.

No confetti, fireworks, streaks, points, or victory language.

### 2.4 Re-entry

When the app reopens:

- restore the last safe case/page/frame if authorized;
- show a compact “Since your last session” summary;
- distinguish member changes, AI/processing completion, and system changes;
- link each summary item to its source;
- preserve unread position in Room; and
- avoid auto-opening sensitive content on a shared screen.

## 3. Solo experience

Solo users receive the complete core product, not an empty team shell.

### Value loops

- **Capture loop:** add source → processing status → review finding → place/connect.
- **Clarity loop:** open Case Home → see gap/contradiction → inspect source → resolve or mark unknown.
- **Planning loop:** accept/edit next step → create task/request → complete with source link.
- **Reflection loop:** write Case Journal note/decision → link object → revisit in report/history.
- **AI loop:** ask with explicit scope → inspect sources/contrary material → approve only useful proposals.

### Solo Room

Room begins as a Case Journal and decision record. It offers:

- notes tied to case objects;
- Shared Case AI thread for official analysis;
- task and decision conversion;
- daily/weekly summary generated on demand; and
- a quiet invitation path.

No copy suggests the product is incomplete because no one has been invited.

### Focus support

- Focus mode hides activity noise and presence.
- User chooses which task/frame is active.
- Notifications pause except security/access/explicit deadline alerts.
- Exit summary states what changed and where work was saved.
- No timer is required; an optional elapsed-session indicator is informational only.

## 4. Team experience

Team engagement is based on coordination and accountability rather than surveillance.

### Value loops

- **Handoff loop:** assign task/request → owner acknowledges → source-linked completion → reviewer resolves.
- **Decision loop:** discussion → proposed decision → review → decision log → downstream tasks/report link.
- **Review loop:** member/AI proposal → comments → correction/approval → audit trail.
- **Recovery loop:** “Since you were away” → source messages/objects → mentions/assignments → resume.

### Presence

Presence communicates coordination only:

- who is currently in the case/page/frame;
- who is editing the selected object;
- temporary cursor/selection if enabled; and
- typing state in the current thread.

Do not calculate online duration, activity scores, response pressure, or productivity ranking.

### Notifications

- Group repeated changes by case/object/thread.
- Mentions, assignments, approval requests, deadlines, access, and security have distinct categories.
- Users can schedule quiet hours and per-case preferences.
- Summaries never outlive deleted messages or revoked access.
- Lock-screen content is generic by default.

## 5. Motion principles

### 5.1 Motion must answer a question

Use motion only to explain:

- where something came from;
- where it went;
- what changed;
- what is grouped/connected;
- what is provisional versus applied;
- whether a process is progressing; or
- how to remain oriented during navigation.

If a transition cannot answer one of these, remove it.

### 5.2 Motion hierarchy

| Class | Purpose | Typical duration |
| --- | --- | --- |
| Immediate feedback | press, selection, focus acknowledgement | 70–120 ms |
| Local state | toggle, tab, status change, compact expand | 120–180 ms |
| Panel/navigation | drawer, Lens, page crossfade/shift | 160–240 ms |
| Spatial causality | add-to-board, group, connect, move to frame | 220–320 ms |
| Proposal review | ghost preview enter/accept/reject | 200–360 ms |
| Long process | real progress, indeterminate only when necessary | duration of process |

Durations are hypotheses requiring observation on Windows/macOS and representative hardware.

### 5.3 Easing

Proposed CSS curves:

- Enter: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Exit: `cubic-bezier(0.4, 0, 1, 1)`.
- Standard state: `cubic-bezier(0.2, 0, 0, 1)`.
- Direct drag follows input with no decorative easing.

Avoid bouncy springs for evidence, destructive actions, deadlines, and legal content.

## 6. Motion choreography by event

### Navigation

- Work Surface content fades 0→1 with at most 8 px directional shift.
- Case Spine active marker moves between destinations.
- Focus enters the new page heading or restored object according to navigation type.
- Reduced motion uses immediate replacement and focus change.

### Open/close Context Lens

- Width/overlay translates from the right over 180–220 ms.
- Main content does not repeatedly reflow while dragging panel width; resize uses direct feedback.
- Closing restores focus to the invoking control or selected object.

### Upload to evidence

1. Local source appears in upload queue immediately.
2. Real stage text changes: validating → uploading → processing → review available.
3. “Add to board” animates a proxy from library row to destination for 240–300 ms.
4. The evidence card settles once; no repeated pulsing.

### Create/connect on Board

- New object scales from 0.98 and fades in over 140–180 ms.
- Connector draws from origin to destination over 160–220 ms only when that helps causality.
- Relationship label appears with the connection.
- Invalid connection returns to origin and announces why.

### Focus Lens

- Related objects retain full opacity.
- Unrelated objects move to a muted tonal layer over 160 ms, never disappear.
- Escape or clear restores instantly enough to preserve orientation.

### AI ghost proposal

1. Proposal frame appears with a violet patterned boundary.
2. Ghost objects/edges fade in without moving accepted objects.
3. Affected accepted objects receive a nonpulsing outline.
4. Approval transitions ghost → normal destination style and records origin.
5. Rejection dissolves only the ghost layer; accepted content never jumps.
6. Edit keeps the proposal visible while selected fields/positions change.

### Contradiction review

- Selecting a contradiction opens a side-by-side comparison.
- Source highlights appear simultaneously; do not animate one side as more truthful.
- Resolution updates labels and counts with a short crossfade.

### Collaboration

- Presence enters/fades over 120–180 ms.
- Remote cursor movement is smoothed lightly but never lags local input.
- New messages do not move the reader if they are reviewing history; show a “New messages” anchor.
- Assignment and decision conversion show destination movement once.

### Save and sync

- Draft/save text updates quietly in place.
- Offline/reconnecting becomes persistent enough to notice but does not pulse.
- Successful reconnect shows restored state and any conflicts, not a celebratory animation.

## 7. No-motion zones

Avoid decorative animation while the user is:

- reading an original source;
- comparing contrary material;
- reviewing a payment, share, deletion, or retention confirmation;
- selecting exact text/page/time locators;
- entering sensitive narrative or conflict-screening data; or
- using a screen reader/high-contrast mode where motion adds no value.

Progress indicators may remain, but never animate the text being read.

## 8. Reduced-motion behavior

When reduced motion is active:

- spatial slides become immediate swaps or short opacity changes ≤ 80 ms;
- connector draw becomes instant;
- board focus dimming becomes immediate;
- drag/drop retains direct pointer tracking but removes settling animation;
- AI ghost proposal appears as a static patterned layer;
- presence cursors may update discretely;
- no autoplay video, parallax, canvas drift, or animated background; and
- every causal change receives text/icon/live-region feedback.

Reduced motion is available during onboarding and in settings, and honors the operating system by default.

## 9. Sound

V1 has no required sound.

If sound is explored later:

- off by default;
- separate master and semantic-event controls;
- short, low-intensity, and nonverbal;
- never used for allegations, contradictions, deadlines, payments, or destructive actions;
- never the only feedback; and
- automatically respects OS accessibility and focus modes.

## 10. Content tone that supports return

- “Continue reviewing the two unprocessed files,” not “Don’t lose your progress.”
- “3 questions remain open,” not “Your case is only 70% complete.”
- “A source changed since this analysis,” not “Your case is at risk.”
- “Jordan assigned a document request,” not “Your teammate is waiting.”
- “No collaborators yet. Keep a case journal or invite someone when ready,” not “Invite teammates to unlock Room.”

The product motivates with clarity and agency.

## 11. Evaluation

Motion and engagement are approved only after testing:

- comprehension of origin/destination;
- time to resume after return;
- ability to find mentions/assignments/decisions;
- solo Room usefulness;
- distraction during source reading;
- reduced-motion equivalence;
- pointer and keyboard latency;
- large-board performance;
- notification burden; and
- whether users understand progress as organization rather than outcome.

Do not optimize time-in-app as a primary success metric. Prefer successful task completion, recovered drafts, source inspection, resolved uncertainty, and confident return behavior.
