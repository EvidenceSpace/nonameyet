# Space as the case board

## The problem with the first whiteboard

The first Space prototype (payment dispute, PR #124 whiteboard) was a capable whiteboard, but the owner pointed out the real flaw: **the board was decoration**. You could draw a link from an email to a question and nothing about the case changed. A detective's board is useful because every pin and string is a claim about the case, and the holes are obvious.

## The idea

**The board is the case.** Every card is a real case object and every string is a claim. The app keeps a small, visible model of the case and recomputes it whenever the board changes:

- **Disputed points**: who supports which version, how much each source counts, a balance, and a plain-words state.
- **What you need to prove**: the legal elements for the case type, each with its current state.
- **What they'll say**: the other side's arguments, and whether each is answered.
- **Holes**: missing papers, missing witnesses, unchecked footage. Each one shown where it belongs.
- **Deadlines and leads**: time-sensitive things such as CCTV being overwritten or limitation periods.
- **Next step**: one honest, justified action that changes as the case changes.
- **Outputs**: letters, briefs and reports written from what the board can actually back up, with references that jump back to the board.

## What we took from real detective boards

The owner shared photos of real case boards: a title, suspects and witnesses with statements and alibis, vehicles, a map with pins, timeline cards, evidence (phone, receipts, CCTV, forensics, bank statements), clippings, numbered markers, "Who? Why? Motive?" questions, leads, sketches, category headers, and red string.

Translated into the product:

| Detective board | EvidenceSpace element |
| --- | --- |
| Suspect/witness photo with statement | **Person** card with their statements and the claims inside them |
| Red string between items | **String** with a meaning (supports a version, contradicts, rule applies, related) |
| "Who? Why?" question cards | **Disputed point**: a question with two (or more) versions |
| Map with pins | **Place**: a to-scale plan with people, vehicles, cameras and sightlines |
| CCTV stills, photos | **Media**: video/photo with frames you can pin onto a point |
| Receipts, bank statements | **Money** ledger, with each amount backed by a paper |
| Leads ("check the pharmacy camera") | **Lead** with a deadline and a one-click action |
| Clippings, law | **Rule** card (statute, code, contract clause) |
| Sticky notes | **Note** (visual only, never looks like evidence) |

## Strings that compute

A string from a claim to a disputed point says "this source supports this version". Its weight depends on the source:

- A party's own statement counts once.
- An independent witness counts double.
- Footage, a measurement or an official record counts most.
- A struck claim counts zero, and the reason is always shown (for example, "stood behind the signal, couldn't see it").

The point's state is shown in words, never as a score: *Disputed*, *Leaning your way*, *Strongly supported*, *Leaning against you*. It's also strongly supported when objective evidence sits on one side only.

**Honesty rule:** these weights are a thinking aid, not a legal verdict. The UI says so, the person can override every judgement, and a lawyer's view wins. See open-questions.md.

## Visible holes

Gaps are first-class objects, not warnings:

- A ledger line with a dashed "2 receipts missing" slot you can drop a paper into.
- A video marked "Not reviewed yet".
- A light on the plan showing "?" until evidence proves its colour.
- A lead with "likely deleted by 3 Apr · 7 days left".

## Lenses and versions

The place view can show **What the evidence shows** (only proven things, unknowns as "?"), **Your version** and **Their version**. Each version has a list of what fits and what doesn't, drawn from the board.

## Follow the string

Selecting a card highlights everything connected to it and fades the rest. Hovering a claim lights up its string. References in letters jump back to the exact card, frame or paper.

## Engagement without gimmicks

People come back because the case moves: new papers, replies, deadlines, a point turning from disputed to supported, a letter becoming ready. No streaks, badges or points.

## Build stages (proposed)

1. Building blocks and the reasoning model as data (no fancy visuals): people, claims, disputed points, money, deadlines, next step, letter.
2. Getting a case in: upload, suggestions, confirmation.
3. Board interactions: strings with meaning, holes as drop targets, follow-the-string, versions.
4. Media: video with frames and pinning, photos with markers.
5. Place: map plan with user-placed items and sightlines. Measurement only as a labelled estimate.
6. Room calls and live collaboration.
