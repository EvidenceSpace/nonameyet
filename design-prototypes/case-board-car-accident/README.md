# Case board prototype: car accident (design reference)

A design-phase prototype of Space as a case board. It isn't product code and isn't shipped. The design docs are in `docs/design/case-board/`.

The case (Reyes v Kowalski, Hale Road crash) is fictional. See `docs/design/case-board/prototype-car-accident.md` for what is real and what is simulated.

## Run

No build step and no dependencies. Open `index.html` in Chromium (designed for 1920×1080; it scales to fit).

Fonts: put `InterVariable.ttf` (Inter, SIL OFL) and `Caveat.ttf` (SIL OFL) in a `fonts/` folder next to `index.html`. They aren't committed. Without them the page uses system fonts.

## Files

- `src/data.js`: people, documents with highlighted claims, loose papers, junction geometry, vehicle motion (10 units = 1 m; t = seconds after 08:42:00), signal plan
- `src/board.js`: cards, strings, disputed points, cost ledger
- `src/app.js`: view, pan/zoom, state, icons, weighing engine (`supportsOf`, `verdict`)
- `src/render.js`: card templates
- `src/scene.js`: to-scale SVG plan and the canvas dashcam projection from Joan's seat
- `src/interact.js`: strings and label placement, drag/pan/zoom, scrubbing, frame pinning, measuring, sightlines, reflow
- `src/panels.js`: proof panel and next step, reader, loose papers, CCTV request, letter of claim, comparing accounts, Dana's cursor and comments, boot
- `src/style.css`: all styles (app shell and board)

`window.__app` exposes state for scripted checks.

## How these files were made

The original working files were lost when the design workspace was reset. These files were split back out of the single-file HTML that was delivered in chat, so the code is the same as the delivered version. Only the file layout changed: before, a build script joined the files; now `index.html` loads them directly.

## Verified

- Design session, original files: the full click-through (sightlines → strike Ade → compare Marek → pin frame → measure → loose papers → CCTV request → letter → send to Dana) ran in headless Chromium with no page errors. A walkthrough video was shared in chat and isn't stored here.
- After the split: the board loads, and "Check Ade's view", "Loose papers" and "Draft letter of claim" open with no page errors. The full flow wasn't run again on the split files.
