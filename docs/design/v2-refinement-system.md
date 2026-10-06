# v2 refinement system

Status: approved by the owner on 6 October 2026 (case bible, wording rule, type
and density rules). First built in the connected slice: Home, Cases, Brief,
Space and Evidence.

Refine, do not redesign: the shell geometry, seven-lens order and approved
screens stay. This document records what changed and the rules every later
screen follows.

## Case bible

All demo content comes from `web/evidencespace-pages/fixtures.js`. Pages never
hard-code names, IDs, dates or amounts.

| Item | Value |
| --- | --- |
| Signed-in person | Alex Morgan (AM), independent designer, Alder Workspace |
| Other party | Harbor Studio, contact Mia Collins |
| Collaborators | Riley Shah (RS, editor), Jordan Kim (JK, commenter) |
| Lawyer | Hana Chen |
| Money | One invoice, `Invoice-4817.pdf`, £4,800 |
| Key dates | Agreement 14 May · delivered 31 July · concern 2 August · call 5 August · due 14 August · today 28 August |
| Evidence | E-01 agreement, E-02 invoice, E-03 “Received, thank you”, E-04 2 August email, E-05 layout screenshot, E-06 call note |
| ID prefixes | E- evidence, R- research, W- work, T- thread, RP- report, B- booking, N- notification |

Riley's surname is Shah rather than Morgan so the case doesn't show two
Morgans. Only Harbor Studio (C-03) is fully written; the other three cases say
so on their Brief, Space and Evidence pages instead of borrowing C-03 content.

## Wording

- Write the way a careful person would explain it across a desk.
- Assistant output is labelled **Suggested · not added** and uses one visual
  treatment: violet, dashed border. It replaces the earlier
  `AI proposal · NOT APPLIED` label with the same contract — nothing is added
  until a person chooses **Add to Work**, and every add or dismiss can be
  undone.
- At most one disclaimer per page, placed where the risk is. The Brief's is:
  “This summarises what your sources say. It can’t tell you how a court would
  decide.”
- No uppercase eyebrows above headings. A small grey line is used only where it
  orients (date on Home, “Next step” on the Brief).
- Preview-only actions say so in their confirmation (“Saved in this preview
  only.”). Unbuilt destinations say what they will hold and that they aren't in
  the preview yet.

## Type and density

| Level | Size | Weight |
| --- | --- | --- |
| Page title | 28 px | 680 |
| Section title | 18 px | 650 |
| Object title | 15 px | 650 |
| Body | 14 px | 400 |
| Label (minimum) | 12 px | 600 |

- One status per object; at most two pills per card.
- Font stack: Inter, Segoe UI Variable, Segoe UI, SF Pro, Noto Sans, system UI,
  so Windows and macOS builds each get their native face when Inter is absent.

## Colour meaning

The same tone means the same thing everywhere: green supports, coral
contradicts, amber is uncertain or open, teal is official guidance, violet is
a suggestion. Contrary material keeps its coral edge on every screen. Dark mode
re-tunes each tone; documents stay on white paper so highlights read the same.

## Frame

- The rail owns global destinations. It is light, with the dark brand mark from
  the prototype.
- The top bar owns context: workspace + search on global pages; case name,
  the seven lenses and people on case pages. The duplicate Home/Cases/Lawyers
  tabs are gone.
- Case pages carry a **key dates ribbon** under the top bar. It shows the gaps
  between events (“11 weeks”, “2 days”), each date opens its source, it can be
  collapsed; the choice holds until the page reloads.
- The details panel (Context Lens) opens for any evidence item, keeps the page
  underneath in place, and returns focus to the exact control that opened it.

## Connection map

One component, drawn from data. Each case has its own map in
`caseMapsFixture`; lines are computed from node positions. Line types: supports
(solid green), contradicts (solid coral), open point (amber dashes), guidance
(teal dots), suggestion (violet dashes). It appears on Home, Cases and Brief and
grows into the Space board.

## Space board

- Cards can be dragged, or moved with the arrow keys (Shift for larger steps).
  Connectors and their labels follow live, and lines that share a card edge
  spread out instead of meeting at one point.
- Selecting a card opens an inspector beside the board and dims unrelated lines.
- The suggested card can be added to Work (it settles into place as W-01) or
  dismissed; both offer Undo. Reset layout also offers Undo.
- Outline view lists the same cards by relation and is the default in narrow
  windows.
- Layout is kept while you move between pages and resets when the page reloads.

## Motion

- Shared-element transitions (View Transitions API) carry the clicked object
  into the next page — a map node or Brief reference into the Evidence viewer.
- Pages enter with a short fade and lift; the inspector and details panel slide
  in; added items settle.
- With reduced motion, all of it is instant.

## Not done yet

Research, Work, Room, Reports, New case, Lawyers, Notifications, Settings and
onboarding still use honest placeholders and need the same pass.
