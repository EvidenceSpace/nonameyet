# Space: direction proposal (draft for owner review)

Status: proposal, not approved. No app code changed. PR #124 stays unmerged.
Visual reference: the owner preferred mockup "space-e" (kept outside the repository).
Grounded in: `docs/product/board-and-ai-copilot.md`, `docs/design/app-experience-blueprint.md`,
`docs/engineering/target-architecture.md` (board engine decision).

## 1. What went wrong so far

Each mockup invented its own elements and features for one screen. There was no shared model of
what an element is, what it can do, and how it connects to the rest of the case. Without that,
every new image either piles features on or strips them away, and the demo was a toy.
Fix: define the element system and interaction grammar first; every screen comes from it.

## 2. The core idea: one case object, everywhere

An email, a clause, a person, a date, a question: each exists once in the case and appears in
many places — Evidence list, Space card, timeline dot, Brief citation, Room message, task.
Label it, comment on it, or link it in one place and it changes everywhere.
Every element shows "Used in": e.g. *Space · Brief §3 · Task "Ask Mia" · Room thread*.
This is what makes the app feel connected rather than seven separate tools.

## 3. Element families

| Family | Examples | Comes from | Looks like |
| --- | --- | --- | --- |
| Source | PDF, email, image, audio, call note | Evidence upload / capture | Card with real preview, exhibit no., date |
| Quote | One sentence or clause | Pulled out of a source by highlighting | Large quoted text + exact page/line |
| Event | "Files delivered 29 Jul" | User, or suggested from a source | Date-first card; sits on the timeline |
| Person / org | Mia Collins, Harbor Studio | Case parties | Round avatar chip |
| Question | "Was the work accepted…?", "Did she open the files?" | Brief issues, user | Bold card with helps / hurts / open counts |
| Task | "Get the download log" | Any element → Make task | Checkbox card, assignee, due date |
| Research | Statute, case, guidance | Research tab | Distinct paper style + publisher/jurisdiction |
| Visual only | Sticky, text, shape, pen, highlighter, frame | Toolbar | Never shows an evidence badge |

Rules (from the spec): an unlabelled line is just drawing; a labelled link (helps, contradicts,
same date, mentions…) is a case relationship. Visual-only items never look like evidence.

## 4. One grammar for every element

So users never have to learn "what this element can do":
- **Select** → the same small bar every time: Link · Comment · Open · Make task · Add to brief · More.
- **Drag onto** a question or another card → choose the relationship.
- **Double-click** → opens the source side by side, scrolled to the exact spot.
- **Same actions** in right-click, keyboard shortcuts and the outline (accessible list view).

### Semantic zoom (how one element stays simple yet rich)
- Far out: coloured chips grouped in clusters — the shape of the case.
- Normal: cards with the key line, date, counts.
- Close in: the card grows into a readable preview (email body, PDF page).
- Open: side-by-side with the original.
The element shows more only when you get closer, so the board never gets crowded.

## 5. Signature interactions (the reason to work here)

1. **Pull a quote:** highlight a sentence inside a PDF or email and drag it onto the board.
   It becomes a quote card tied to page and line. This is the core action, and no whiteboard does it.
2. **Focus:** click any card; everything connected lights up, the rest fades.
3. **Time scrub:** drag across the date strip (e.g. 29 Jul → 2 Aug); cards from that range light up
   and the gap is measured ("4 days").
4. **Compare:** click a "contradicts" link → the two sources open side by side.
5. **Arrange:** By date / By side / By person shows a preview first; your own layout is never lost.
6. **Work with a lawyer on the board:** invite a lawyer to the case, or share one board; their
   comments are clearly marked. Self-represented users can ask for a review from the board.
7. **Leave with something:** every session can end in a task, a reply draft, or a brief section.
8. **Suggestions** (later, from the copilot) appear as faint ghost cards or links labelled
   "Suggested", with accept / dismiss. Nothing changes without approval.

## 6. Why people come back (no streaks, no badges)

- The case changes: new emails, replies, deadlines (payment due, limitation periods). Space shows
  what changed since your last visit and who did it.
- Visible clarity: questions move from "open" to "backed" as you work.
- Real outcomes: a brief or a reply they can send, and lawyer time that costs less because the
  case is already organised.

## 7. How Space connects to every tab

- **Brief** defines the questions; Space shows the proof; "Add to brief" writes back with citations.
- **Evidence** holds the originals; dragging from the library places a card; cards open the original.
- **Research** results drag onto the board as research cards, linked to questions.
- **Work** receives tasks made from any card or sticky; finished tasks update the board.
- **Room** messages and files can be dropped on the board; board comments can open a Room thread.
- **Reports** are built from the Brief and selected board frames.

## 8. Market position (from general knowledge, to verify before marketing)

- Lawyer case-analysis tools (e.g. LexisNexis CaseMap, Casefleet, Everlaw Storybuilder) are
  spreadsheet/timeline-based, built for firms and expensive, not visual or collaborative in this way.
- Whiteboards (Miro, FigJam, Milanote, Heptabase) are visual but know nothing about evidence,
  dates, provenance or the law.
- Self-help legal tools are mostly chat or forms.
Gap: a visual, source-backed, collaborative case workspace usable by both lay people and lawyers,
with a lawyer available inside the app.

## 9. How we build it

1. Agree this document (owner).
2. Interactive Space prototype at the quality of `space-e.png`, with the signature interactions
   (pull a quote, focus, time scrub, labelled links). Video + HTML for review.
3. Board engine decision (ADR) per `target-architecture.md`: license, 1,000+ objects, custom
   rendering, collaboration, accessibility outline. Candidates: tldraw SDK (commercial licence
   needed), React Flow (MIT) plus a custom ink layer, or a narrow custom engine.
4. Build in small slices, each with: unit + browser tests, screenshot checks, keyboard/outline
   access, permission and audit checks, performance check, and an owner review video.
