# Prototype: car accident case board (Reyes v Kowalski, fictional)

A single interactive HTML file built in the design phase. Source: `design-prototypes/case-board-car-accident/`. A walkthrough video was shared with the owner in chat. It isn't stored in the repository because recordings stay out of the repo.

## Story

Sam's Fiesta was hit at a light-controlled junction by Marek's van. Marek's insurer says he had a green light and Sam was speeding. Witnesses: Joan (driving behind the van, has a dashcam) and Ade (at a bus stop). Dana is Sam's solicitor and is live on the board.

## What the walkthrough shows

1. Dana's comment "could Ade even see the light?" becomes the next step. Sightlines on the to-scale plan show Ade stood behind both signals. Sam decides to stop counting Ade's light claim, and the reason stays visible.
2. Marek's two accounts are compared side by side ("didn't see the lights" vs "green light"). Sam strikes his green claim.
3. Joan's dashcam is scrubbed to 08:42:06.07. The frame is dragged onto the light question and marked Red. The point becomes strongly supported.
4. Measuring: 7.7 m in 0.79 s, about 22 mph, under the 30 limit. Their speeding point is answered.
5. Loose papers fill the money gaps (£4,800 → £5,460). The council timing plan lets the scene work out Sam's light.
6. A CCTV request goes to the pharmacy before 3 Apr. The letter of claim is written from the board with clickable references, then sent to Dana.

## Real logic vs simulated

**Real in the prototype:** weighing and verdicts, proof panel, next step, letter generation, column reflow, vehicle timings and geometry, the dashcam render, scene versions and fit lists.

**Simulated:** Dana's cursor and replies, the text "found" in uploaded papers, sending, and the documents themselves.

## How each piece could be real in the product

| Prototype piece | Real-world source | Notes |
| --- | --- | --- |
| Junction plan | OpenStreetMap road geometry (free, sometimes includes signals); satellite imagery from a licensed provider (cost) | The user places vehicles, people and cameras; labelled "drawn by you" |
| Dashcam | The user's uploaded video | Play, scrub, timestamps and frame pinning are straightforward |
| Rendered 3D dashcam | Not needed in the product | It existed only because there was no real footage |
| Sightlines | Geometry on the plan from placed items and signal direction | Shown as a check that helps the person think, not proof |
| Speed measurement | Two frames plus a distance from the plan | Must say "estimate"; experts do this properly |
| Signal timing plan | Request from the local council | Shows how a record unlocks inferences |
| Found text in papers | AI extraction with source locations | Confirm before use |
| Live solicitor | Real collaboration and Room | Later slice |

## Known rough edges

- In the full overview, string labels collapse to dots because the gaps between cards are narrow. They show on hover or select.
- When zoomed in, cards pass under the page title.
- The weighing is deliberately simple (see open-questions.md).
