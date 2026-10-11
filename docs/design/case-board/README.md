# Case board: Space as the case

Status: **design direction, owner-reviewed in conversation (11 October 2026)**. Not implemented in app code yet. The owner's reaction to the car-accident prototype was strongly positive. The owner then asked hard questions about how real it is, which these documents answer honestly.

This folder holds everything about the case-board direction, so any agent or model can continue without the chat.

| Document | What it covers |
| --- | --- |
| [space-as-case-board.md](space-as-case-board.md) | The core idea: the board computes the case. Element families, strings that mean something, holes, next step, outputs. |
| [building-blocks.md](building-blocks.md) | Spec for the reusable elements (person, claim, disputed point, money, deadline, place, media…), their fields, and how they connect. |
| [getting-a-case-in.md](getting-a-case-in.md) | How a real case reaches the board: upload, AI suggestions, the person confirms, the board fills. First impression and first-run. |
| [real-life-journeys.md](real-life-journeys.md) | Day-by-day journeys through five real situations. For each: what people open, where they would quit, what makes them pay. |
| [room-and-calls.md](room-and-calls.md) | Room as the place people in a case talk: chat, voice/video calls, "Dana is calling you", notes and decisions saved to the case. |
| [other-sections.md](other-sections.md) | How Brief, Evidence, Research, Work, Room and Reports become views of the same case data. |
| [prototype-car-accident.md](prototype-car-accident.md) | The interactive prototype: what it shows, what is real logic vs simulated, and how each part could be real in the product. |
| [open-questions.md](open-questions.md) | Risks, unknowns and decisions required before building. |
| [space-direction-2026-10-09.md](space-direction-2026-10-09.md) | Earlier Space proposal (element grammar, semantic zoom, signature interactions). Still valid underneath the case-board idea. |

Prototype source: `design-prototypes/case-board-car-accident/` (build instructions inside).

## Owner direction, in the owner's words (paraphrased)

- The app must be unique, creative, engaging, smooth, professional and simple to understand. Everything connected. Never boring. Worth paying for.
- No AI-sounding wording or AI-looking design. No gimmicks: no streaks, badges or scores for fun. Don't copy other apps.
- The board felt like decoration until links changed the case. Strings must compute consequences.
- Show things working by example, not as isolated clips. Don't fake progress.
- Think about real cases and real people: would they use it, is it useful, does everything make sense, do things work.
- The first impression must be good and helpful.
- Room: people in a case should be able to talk and call each other, with a clear "is calling you in the Room" notification.
- Keep the repository updated with handoff, ideas, features and specs, so nothing lives only in chat.
- Never merge without the owner's approval in this phase. PR #124 (`design/space-whiteboard`) stays unmerged.
