# First day with a case: intake prototype (design reference)

A design-phase prototype of how a case gets in and what the first day feels like. It isn't product code and isn't shipped. The design is described in `docs/design/case-board/first-day-intake.md`.

The case is the same fictional car accident as `../case-board-car-accident/`, on its first day (Tuesday 4 March 2025). Sam Reyes starts on his phone at the junction, then opens the case on his laptop that evening.

## Run

No build step and no dependencies. Open `index.html` in Chromium (designed for 1920×1080; it scales to fit).

Fonts: put `InterVariable.ttf` (Inter, SIL OFL) and `Caveat.ttf` (SIL OFL) in a `fonts/` folder next to `index.html`. They aren't committed. Without them the page uses system fonts.

The dark bar at the bottom is prototype-only: switch scenes, auto-type Sam's account, restart. You can also type your own account; the highlighting runs on what you type.

## Flow

1. **Phone, 08:51.** What happened → When → Is anyone hurt → "While you're still there" (photos, other driver's details from a photo of their certificate, people who saw it, a voice note, tell your insurer) → save with an email.
2. **Laptop, 19:40.** The case is already there: cards from the phone, the proof panel with gaps and "usually shown by", deadlines, one next step.
3. **Own words.** Sam writes what happened. The parts that matter are highlighted as he types. On save he chooses what to add. A disputed point appears: your word against his.
4. **Add files.** Three files are read (Joan's email, a receipt, a police text) along with the morning's photos. Five suggestions are found.
5. **Check, one at a time.** Source on the left, suggestion on the right. Add, Edit or Not now (A / E / N). Every Add changes the board and the board moves to show it.
6. **Next step.** The camera lead creates a deadline, and the next step becomes asking Hale Pharmacy to keep their footage. The request is drafted with sources and saved, not sent.
7. **Simple view.** The same case as a list.

## Files

- `src/data.js`: icons, photo illustrations, people, Sam's account, extraction patterns, files, the five suggestions
- `src/phone.js`: the phone scene
- `src/desk.js`: the proof panel, deadlines, next step, header, board cards and strings, simple view (all worked out from state)
- `src/flow.js`: writing, files, the check panel, drafts, Loose papers, dragging, scene switching, boot
- `src/shell.css`: shared app shell styles from the case board prototype
- `src/intake.css`: everything else

`window.__intake` exposes state for scripted checks.

## Verified

- A scripted click-through of the whole flow, phone to simple view, ran in headless Chromium with no page errors.
- Screens were reviewed at 1920×1080 after each fix.
- A walkthrough video was recorded with real clicks. It was shared in chat and isn't stored here.

## Not real

The photos are flat illustrations. Highlighting uses fixed patterns, not a model. Reading is timed, not real. Phone-to-laptop sync, the email forwarding address, reminders and saving are simulated.
