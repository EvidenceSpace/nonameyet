# Space whiteboard

Status: built in October 2026; awaiting owner review. Space is the case's freeform
board. It follows the existing visual style (tokens, rail, top bar, frame);
Refine, do not redesign applies to the rest of the slice.

## What people can do

- **Move around**: scroll or drag with the Hand tool, hold Space and drag, or
  use the middle mouse button. Ctrl/⌘ + scroll or pinch zooms at the pointer.
  Zoom controls, Fit everything and a minimap sit bottom right.
- **Add things**: sticky notes (double-click anywhere, or N), text (T), shapes
  (R; rectangle, ellipse, diamond; drag to size), frames (F; items inside move
  with the frame), and case items from **Add from case** (evidence, people,
  dates, questions; drag onto the board or press Add). New questions can be
  written in the drawer.
- **Draw**: pen (P) and highlighter (M) with colours; the eraser (E) removes
  drawings only, never cards.
- **Connect**: drag from a dot on any card to another card, or use the Connect
  tool (C). Each link has a type (Supports, Contradicts, Related, Open
  question), an optional label and a direction. Dropping a link on empty space
  creates a connected sticky note.
- **Edit**: select, shift-select or drag a box; resize from corners (Shift keeps
  proportions); colours, shape, duplicate, bring to front/back, wrap selection
  in a frame, delete. Undo/redo, copy/paste, arrow-key nudge and a shortcuts
  sheet (?) are available.
- **Boards**: several boards per case. New board offers Blank, Case map,
  Timeline, Claims vs evidence and People & parties. Boards can be renamed,
  duplicated and deleted (two clicks; the last board can't be deleted).
- **Suggest links**: shows links between case items already on the board that
  are likely related, each labelled “Suggested” with its reason. Nothing is
  added until the person accepts it; dismissing hides it for the session.
- **Source details**: selecting E-04 offers Details (Context Lens) and Open
  source. Other sources have no viewer in this slice yet.

## Storage and limits

- Boards are stored in this browser's local storage per case
  (`evidencespace.space.v1.<case>`). Nothing is uploaded, shared or synced.
  The status reads “Saved in this browser”, or says plainly when storage is
  unavailable.
- Stored boards are validated before drawing (`space-model.js`); unknown types,
  broken links, bad numbers and unknown case references are dropped, and all
  text is escaped.
- Case items come from the synthetic fixtures. Every case currently shows the
  Harbor Studio material, as the rest of the slice does.
- Not proven: real screen readers, touch devices beyond emulation, very large
  boards, multi-user editing.

## Code

- `web/evidencespace-pages/space-model.js` — data model, validation, geometry,
  templates, suggestions. Covered by `tests/evidencespace-space.test.ts`.
- `web/evidencespace-pages/space.js` — rendering and interaction.
- `tests/browser/evidencespace-space.spec.ts` — browser behaviour.
