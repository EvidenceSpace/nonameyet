# Design baseline

Portable interface rules. Stack independent, and deliberately narrower than a
design system.

## This file does not define tokens or styles

`web/` already has a working CSS layering system. Use it. Do not introduce a
parallel token set, a second reset, a utility framework, or a competing naming
convention beside it — two design systems in one codebase is worse than either
one alone.

The existing layers, in the order they are meant to be reasoned about:

- `web/base.css` — foundational element styling.
- `web/workspace-base.css` — shared workspace shell.
- `web/styles.css` — entry composition.
- `web/accessibility.css` — focus, motion and assistive behaviour.
- `web/responsive.css`, `web/workspace-responsive.css` — adaptation by viewport.
- Per-feature stylesheets (`intake.css`, `review.css`, `timeline.css`,
  `provenance.css`, `report.css`, `cases.css`, `consistency.css`,
  `readiness.css`, and the rest) — one concern each.

**Before adding any style:** open the layer it belongs in and follow what is
already there. New visual values belong wherever this codebase already keeps its
values, not in a new file invented for the occasion. If a feature needs its own
stylesheet, name it after the feature and keep it to that feature.

## Hierarchy

On every screen, one thing is most important. It is the largest, the highest
contrast, or the only coloured element — not all three. If two elements compete
for primary attention, neither wins and the user pauses.

One primary action per view. Secondary actions look secondary. Destructive
actions are visually distinct and never adjacent to the action a user takes most
often.

## Spacing and alignment

- Use one consistent spacing scale. Arbitrary one-off values are the fastest way
  to make a careful interface look sloppy.
- Related things sit closer together than unrelated things. Proximity carries
  more meaning than borders, so group by spacing before reaching for a box.
- Align to a shared edge. Ragged left edges read as broken even when nothing is.
- Optical alignment beats mathematical alignment: icons, glyphs and round shapes
  often need a pixel of adjustment to look centred. Trust the eye.

## Typography

- Body measure between roughly 45 and 75 characters per line. Wider text is
  measurably harder to track back to the next line, and this product asks people
  to read carefully.
- At most two type sizes per screen region. Size differences must be obvious —
  a 1px difference reads as a mistake, not a hierarchy.
- Body text and long-form reading content are never lighter than the surrounding
  UI labels.
- Numbers that are compared vertically (amounts, dates) use tabular figures and
  consistent decimal placement, so columns scan.

## Colour and contrast

- Meet WCAG AA: 4.5:1 for body text, 3:1 for large text and for meaningful
  non-text elements such as icons that carry state.
- Never encode meaning in colour alone. Conflict, warning, confirmed and
  suggested states each need a shape, an icon, a label or a position too — for
  colour-blind users, in print, and in the exported reports this product
  produces.
- Respect the user's colour scheme preference rather than forcing one.

## Motion

- Motion exists to explain a change: where something came from, where it went,
  what is now loading. Motion that only decorates costs attention and returns
  nothing.
- 150–250ms for most transitions. Under 100ms is not perceived; over 400ms feels
  broken on repeat use, and every animation is on repeat.
- Ease out for entrances, ease in for exits. Linear reads mechanical.
- Animate `transform` and `opacity`. Animating layout properties causes jank on
  exactly the long lists and long documents this product renders.
- **Never animate anything the user is trying to read.** Text that fades in
  during reading is a defect.
- Honour `prefers-reduced-motion` for every animation, without exception. Reduced
  motion means the change still happens and is still explained, instantly.

## Feedback and latency

- Under 100ms: no indicator. Adding one makes it feel slower.
- 100ms–1s: inline indicator on the element that was acted on.
- Over 1s: progress with real information, and a way out. "Processing" with no
  sense of scale is where users assume the app is broken and reload — which, for
  a long extraction, is the most expensive thing they can do.
- Long or interruptible work says what will happen if it is cancelled or
  interrupted, before it is.

## Empty, partial and error states

- Empty states explain what goes here and offer the first action. Never a blank
  region, never a lone spinner that has finished.
- Partial results are labelled as partial, with what is missing and why.
- Errors say what happened in the user's terms, what was and was not saved, and
  what to do next. Never a raw exception, never a status code alone.
- Nothing important is communicated only by something disappearing.

## Keyboard and focus

- Every interactive control is reachable and operable by keyboard, in an order
  that matches the visual order.
- Focus is always visibly indicated. Removing outlines without replacing them is
  a defect.
- Modals and overlays trap focus while open and restore it to the trigger on
  close.
- Escape closes what Escape appears able to close.

## Forms and destructive actions

- Labels are visible, not placeholder-only. Placeholders disappear exactly when
  they are needed.
- Validate on blur and on submit, not on every keystroke. Errors appear next to
  the field, not only in a summary.
- Never clear a user's input on a failed submit.
- Destructive actions state what will be lost in specific terms, and are
  reversible or explicitly warned as irreversible. Given this product deals with
  material users may not have another copy of, prefer reversible.

## Density and reading

This product asks people to read, compare and trust documents. That makes it a
reading interface, not a dashboard. Prefer calm density: generous line height,
restrained colour, quiet chrome, and no motion competing with the content.

An interface that looks impressive in a screenshot and tiring after twenty
minutes has failed the only test that matters here.
