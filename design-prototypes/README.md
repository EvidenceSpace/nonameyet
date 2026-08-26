# EvidenceSpace design prototypes

These files are review artifacts, not production application code.

## Core experience concept

Open `evidencespace-core-experience.html` in a modern desktop browser. It is self-contained and makes no network requests.

The concept demonstrates:

- Global Dock, North Bar, Case Spine, Work Surface, Context Lens, and Status Floor;
- Case Home hierarchy;
- 2D Board tools, evidence drawer, semantic objects, timeline, connectors, and AI ghost proposal;
- solo and team Room adaptation;
- reports preview;
- private/shared AI scope;
- proposal approve/reject feedback;
- command palette (`Ctrl/Cmd + K`);
- collapsible case/context regions;
- keyboard focus and reduced-motion baseline; and
- synthetic data and clear concept labeling.

## Review controls

- Use the Case Spine to switch Home, Board, Room, and Reports.
- Use **Solo view / Team view** in the North Bar to compare engagement and visibility behavior.
- Use Context Lens tabs for AI, Details, Comments, and Activity.
- Approve or reject the AI proposal to observe the proposed motion/state language.
- Press `Ctrl/Cmd + K` to inspect the command palette.
- Resize the window to inspect hierarchy and panel collapse.
- Enable operating-system reduced motion to inspect the immediate equivalent.

## Boundaries

- No real evidence, legal analysis, authentication, storage, upload, AI, collaboration, payment, or marketplace service is connected.
- The case and people are synthetic.
- Layout dimensions, color values, type choices, and motion timings remain design hypotheses until usability, accessibility, performance, and Windows/macOS review.
- This artifact must not be copied into production as an unreviewed implementation.

Canonical rationale lives in:

- `docs/design/app-experience-blueprint.md`;
- `docs/design/design-system-foundation.md`;
- `docs/design/motion-and-engagement.md`;
- `docs/design/ux-quality-bar.md`; and
- the product contracts under `docs/product/`.
