# First day with a case (intake design)

This turns `getting-a-case-in.md` into a worked design. The prototype is in `design-prototypes/case-board-intake/`. It follows Sam Reyes on the day of his car accident (fictional): on his phone at the junction, then on his laptop that evening.

## Why this flow

From the journeys: Sam quits if day 0 shows a complex board instead of help, or if the first week feels like data entry. So day 0 has two jobs, at two moments:

- **At the scene (phone):** capture what's hard to get later. Ask about nothing legal.
- **That evening (laptop):** make sense of it. Show what has to be proved, what's missing, and one next step.

## At the scene (phone)

| Step | What it asks | Why |
| --- | --- | --- |
| What happened? | Car accident, money owed, landlord or deposit, work, something else | One plain question. No sign-up first. |
| When? | Just now, earlier today, days or weeks ago | "Just now" switches to the at-the-scene list. Others go straight to the evening flow. |
| Is anyone hurt? | Call 999, or No one is hurt | Safety before anything else. |
| While you're still there | Photos · the other driver (photo of their certificate or licence, read and checked) · people who saw it · what was said (voice note) · tell your insurer | Only things that are hard to get later. All optional. A progress bar, no score. |
| Save | Email only | No password at the roadside. The case stays on the phone until saved. |
| Saved | "Look after yourself today. Tonight, open it on your laptop." Reminder at 7pm. | Nothing else is asked that day. |

Rules:

- One tip, in plain words: "Don't say whose fault it was. Just swap details."
- Anything read from a photo (the certificate) is shown for checking before it's kept.
- No legal words on the phone. No board on the phone on day 0.

## That evening (laptop)

The case opens with what came from the phone already placed: Sam, Marek (from the certificate), Joan and Ade (people who saw it), the voice note, the photos, the place (from the photos' location).

Left panel, worked out from the case:

- **What you need to prove**, with each gap saying what usually proves it ("Usually shown by people who saw it, dashcam or CCTV"). One item is settled by law straight away (the red-light rule), so day one already shows progress that is true.
- **Deadlines**, including the court time limit with its caveat in one line ("3 years if you were hurt, 6 years for the car only. A solicitor can confirm this.").
- **One next step.** It changes as the case changes and is never a list.

### Own words

A writing card: "What happened, in your own words." As Sam types, the parts that matter are underlined in place and listed below (time, place, your version, your speed, what he said, someone who saw it). On Save he sees "Add these to your case?" with each item ticked and where it goes. His words are saved either way.

Effect: the disputed point appears, "What colour was the van's light?", with his version against Marek's, and the proof item changes to "Disputed · your word against his". The board has found the question that matters, from his own account.

### Files

"Add files" accepts drops anywhere on the board, or emails forwarded to the case's address. Reading shows each file and what was found in it. When it finishes: "Found 5 things to check. Nothing goes on the board until you say so."

### Checking, one at a time

A bottom panel: the source on the left with the exact passage marked, the suggestion on the right, where it would go, and Add / Edit / Not now (A, E, N).

- Every Add changes something visible. The board moves to show the change, and the panel confirms it in one line ("Added. Joan backs your version. She's independent, so it counts for more.").
- Low-value items are batched ("Two small things": the police reference and Marek's insurer) so they don't waste a turn.
- Not now goes to Loose papers. Nothing is lost.
- If confirming wouldn't change anything, it isn't asked.

The five checks in the prototype and what each changes:

| Suggestion | Source | What changes |
| --- | --- | --- |
| Joan says the van's light was red | Her email, the marked sentence | Joan joins your side of the disputed point; the balance moves; the proof item says "Joan backs you" |
| Joan may have dashcam footage | Same email | A lead card: "Joan's dashcam clip", with a drafted text to her |
| £165 recovery | Receipt | "What it cost you" starts: £165 so far, with the gaps listed (repair estimate, payslips) |
| A camera on Hale Pharmacy | Sam's 08:47 photo, the camera ringed | A lead plus a deadline: "CCTV may be deleted · 3 Apr", and the next step changes |
| Police reference and Marek's insurer | Police text, his certificate | Filed on the right cards |

### The first output

The next step becomes "Ask Hale Pharmacy to keep their camera footage". The draft is built from the case, with numbered sources (his account, his photo). It also asks for a copy as someone recorded in it, under data protection law. It's saved as a draft. Nothing is sent from the app without the person choosing to send.

### Simple view

The same case as a list: next step, what you need to prove, deadlines, people, papers and photos. A toggle in the header, not a separate product. This is the "light mode" from `getting-a-case-in.md`.

## What day one should feel like

- **Helpful straight away.** Within about ten minutes on the laptop, Sam knows the real question (the lights), has a witness on his side, knows about a deadline he'd never have thought of, and has a letter ready.
- **Calm.** A few cards, space left on purpose, gaps that explain themselves.
- **Honest.** Every suggestion is labelled until confirmed, every claim keeps its source, deadlines say how sure they are.

## Open questions

1. **Phone scope.** Is the at-the-scene list a phone web page (no install) or an app? Install at the roadside is a real barrier. Recommendation: a phone web page first.
2. **Save without a password.** Email link sign-in to start; set a password or passkey later on the laptop?
3. **Witness consent.** Storing Joan's and Ade's numbers is fine for Sam's own use. Contacting them through the app needs a clear rule.
4. **Reading photos.** Spotting a camera in a photo is the most impressive suggestion and the most error-prone. It must stay a suggestion with the area marked.
5. **Deadlines by case type and place.** The CCTV "about 30 days" is a rule of thumb, not law, and is labelled that way. All deadlines need qualified review.
6. **Simple view as default** for small money and deposit cases (Priya, Tom & Lena). Probably yes; the board stays one click away.

## Next

- The same first day for Priya (unpaid invoice), starting in simple view, to test that the flow works without a board.
- Day 2 to week 3 for Sam: Joan's clip arrives, the insurer denies liability, he brings in a solicitor. That joins this prototype to the case board prototype.
