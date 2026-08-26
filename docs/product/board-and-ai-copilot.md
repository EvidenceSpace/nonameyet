# Board and AI copilot specification

## Experience contract

The board is the visual center of EvidenceSpace. It must feel direct and expressive without becoming a decorative toy. The AI is aware of authorized case state, but it remains a visible collaborator that proposes rather than silently controls.

## Board layout

### Top toolbar

- case and board name;
- board/view switcher;
- undo/redo and history;
- search and command menu;
- member presence;
- share/invite;
- presentation and focus mode;
- Find a Lawyer shortcut; and
- sync/connection indicator.

### Left tool rail and library drawer

Tools:

- Select/hand;
- Uploads;
- Evidence;
- Elements;
- Web Research;
- Timeline;
- Tasks;
- Text;
- Draw/marker;
- Connect; and
- Frames.

The drawer supports search, filters, sort, keyboard navigation, drag/drop, multi-select, and add-to-board without dragging.

### Center canvas

- infinite pan/zoom with safe numeric bounds;
- snapping and alignment guides;
- frames/chapters;
- grid or free placement;
- selection, multi-selection, grouping, locking, duplication, and z-order;
- cut/copy/paste without duplicating original evidence bytes;
- autosave state, sync state, and recovery; and
- stable serialization across client versions.

### Right panel

Tabs:

- **AI** — current conversation, findings, and proposals;
- **Properties** — selected object data and provenance;
- **Comments** — object/frame discussion;
- **Activity** — history affecting current selection or viewport.

### Bottom controls

Zoom, minimap, fit, current frame, structured outline, keyboard help, and optional performance/detail mode.

## Canvas object types

### Evidence card

Displays preview, title, type, source state, accepted/provisional links, processing warnings, comment count, and permission state. Opening it reveals the original and exact locators.

### Research source

Displays publisher/court, title, jurisdiction, published/updated/accessed dates, source type, saved excerpt, and archival status. Visually distinct from user-provided evidence.

### Entity

Person, organization, location, account, device, vehicle, asset, or case-specific type. Possible duplicate entities remain suggestions until merged.

### Event

Title, confirmed/estimated/disputed date or range, participants, description, sources, and issue-track links.

### Issue track

A possible charge, offense, claim, defense, remedy, complaint, or educational theory. Contains requirements/elements, supporting material, contrary material, unknowns, jurisdiction, sources, and review status.

### Task

Title, status, priority, assignee, deadline, instructions, requested evidence/information, related objects, and origin.

### Visual-only elements

Sticky note, text, shape, photo frame, icon, marker stroke, label, frame, group, and stack. Visual-only items are never rendered with an evidence badge.

### Timeline element

A resizable board component that shows events in chronological order, supports filters, distinguishes confirmed/estimated/disputed dates, and deep-links to sources.

### Connector

Every semantic connector has a relationship type and optional note. V1 types include:

- supports;
- contradicts;
- mentions;
- occurred before/after;
- communicated with;
- belongs to;
- located at;
- requires;
- assigned to; and
- custom labeled.

A line without a label is visual-only and is not interpreted as a case relationship.

## Interactions that make 2D engaging

- **Focus lens:** selecting an item highlights connected paths and dims unrelated material.
- **Evidence stacks:** collapse related items without losing count or warnings.
- **Board chapters:** frames create a navigable presentation path.
- **Contradiction markers:** open a side-by-side comparison and resolution checklist.
- **Timeline scrubbing:** inspect events and connected evidence by time range.
- **Smart layout:** AI or deterministic layout appears as a ghost preview before approval.
- **Causal motion:** restrained animation shows where an object moved or what changed; reduced-motion users receive an instant equivalent.
- **Structured outline:** list/tree view mirrors board semantics and provides an accessible alternative.

Sound effects and 3D presentation are Future, opt-in, and never required for comprehension.

## Evidence library contract

### Sources accepted in V1

- file picker;
- drag/drop;
- clipboard image/text capture with confirmation;
- URL capture;
- manual statement or note; and
- saved Web Research result.

Private messaging, mailbox, social, and cloud-drive connectors are Future.

### Evidence lifecycle

1. Selected locally.
2. Client-side preflight where practical.
3. Upload authorized for one case and object.
4. Original stored immutably and hashed.
5. Security/content validation.
6. Derivatives, preview, extraction/OCR/transcription.
7. Reviewable processing warnings.
8. AI findings created as provisional objects.
9. User accepts, corrects, rejects, or leaves uncertain.
10. Retention, archive, export, and deletion honor all derivatives and audit rules.

The word evidence is organizational. The product does not certify authenticity or admissibility.

## AI copilot modes

### Ask

Answer a question about the app, current object, current view, or authorized case. The context indicator shows which scope is active.

### Analyze

Identify patterns, evidence gaps, contradictions, issue requirements, alternative interpretations, and risks. Analysis must include supporting and contrary material.

### Plan

Propose tasks, deadlines, document requests, questions, and investigation sequence.

### Research

Search external legal and factual sources, show the source hierarchy and research steps, and allow selected results to be saved.

### Act

Propose workspace changes such as creating tasks, adding board items, connecting objects, organizing frames, adding timeline events, drafting reports, or preparing a consultation package.

## Context controls

Every thread shows a context chip such as:

- Product help only;
- Selected evidence item;
- Current board frame;
- Current Room thread;
- Current report;
- Entire case; or
- Named subset selected by the user.

The user can inspect and reduce context. Cross-case context is off by default and never inferred from convenience.

## AI answer and evidence contract

A material answer contains:

- direct assessment;
- reasoning;
- case evidence citations with exact locators;
- external sources with jurisdiction, publisher/court, dates, and URL;
- contrary material;
- assumptions and unknowns;
- confidence described qualitatively and justified;
- next recommended step; and
- optional action proposals.

If a claim lacks a valid source, it is labeled as hypothesis/general guidance or omitted. A numeric model confidence cannot make a claim a fact.

## Legal research hierarchy

1. constitution, statute, regulation, or official code;
2. binding court rule or court decision where applicable;
3. official court/government guidance;
4. licensed or reputable secondary legal source;
5. reputable factual source; and
6. general web result.

The product records jurisdiction, authority level, publication/update/access dates, and whether a source was retrieved live or from an archive. Conflicting authority remains visible.

## Action proposal lifecycle

1. User request or AI suggestion.
2. AI states intended outcome, objects affected, sources, risk, and reversibility.
3. Authorization and current-revision checks run.
4. Ghost/diff preview appears in the destination.
5. User approves, edits, or rejects.
6. Server executes an idempotent, scoped operation.
7. Result is verified and appended to the audit trail.
8. Undo is offered when safely reversible.
9. Failure reports what changed, what did not, and recovery options.

### Approval levels

- **Read/navigation:** no mutation; may run after normal authorization.
- **Draft:** creates a private or shared draft as selected.
- **Reversible mutation:** explicit preview and approval.
- **Sharing/external action:** explicit recipient/data preview and approval.
- **Destructive/financial/legal submission:** separate confirmation; AI cannot batch it behind a generic approval.

AI may never bypass permissions, confirmation, retention, billing, conflict screening, or source-integrity gates.

## Memory model

### User memory

Language, terminology, accessibility, and user-approved preferences. Never infer protected or sensitive traits without necessity and consent.

### Workspace memory

Workspace policy, templates, vocabulary, and member roles.

### Case memory

Accepted facts, provisional findings, evidence graph, events, issues, tasks, decisions, research, and audit history.

### Conversation memory

Thread-specific messages and selected context. Summaries identify their source messages and visibility.

### Shared and private AI

- **Shared Case AI:** visible to authorized members; official case analysis and action proposals.
- **Private AI:** visible only to the user; cannot silently add facts or summaries to the case.
- A user can publish selected private output through a preview that states destination and visibility.

“Remember this” requires a visible target, content preview, and deletion path.

## Prompt-injection and untrusted-content rules

- Uploaded files, webpages, messages, comments, filenames, metadata, and model output are untrusted data.
- Instructions inside case content cannot alter system policy, permissions, tool scope, sharing, or approval requirements.
- Retrieval separates quoted source content from instructions.
- Suspicious instruction-like content is ignored, recorded safely, and surfaced only when useful.
- Tools receive structured arguments derived under policy, not raw source instructions.

## AI personality

The copilot is calm, direct, respectful, and professionally skeptical. It:

- does not flatter or automatically agree;
- corrects the user when sources disagree;
- distinguishes law, evidence, inference, and strategy;
- explains technical terms on request;
- never impersonates a licensed lawyer;
- avoids moral judgment and sensational language; and
- ends substantive answers with a practical next step.

## V1 performance and quality expectations

Exact budgets require architecture benchmarks, but V1 must define and test:

- board interaction frame rate on representative small, medium, and large boards;
- startup and case-open latency on supported devices;
- upload/extraction progress and cancellation;
- realtime convergence and reconnect recovery;
- AI time-to-first-status and end-to-end latency by task;
- citation validity, action success, correction, rejection, and undo rates; and
- memory, storage, and bandwidth limits.

Degrade gracefully: hide previews or simplify rendering before losing object integrity or controls.