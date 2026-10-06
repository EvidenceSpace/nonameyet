# Prototype design review: 6 October 2026

**Status:** review findings and proposed refinement direction. No design is changed by this document.
**Source reviewed:** `design-prototypes/EvidenceSpace-connected-end-to-end-prototype-v1.html` (blob `abcc8e2b5c5e56ba1cfdaf07182b6633c7b03199`, unchanged)
**Also compared:** the connected slice under `web/evidencespace-*`, rendered locally in Chromium at 1600×900

## How the review was done

- I extracted all 37 embedded 1920×1080 screens and inspected each one. The screens that drive the core flow were inspected at full width: Welcome, New case, Home, Cases, Brief, Space, Evidence, Research, Work, Room, Reports, Find a lawyer, Lawyer profile, Booking, Notification drawer and All notifications.
- I parsed the prototype's `ROUTES` table: 37 routes, 325 click areas, 9 guard notes and 14 overlay targets. Every click area was drawn onto its screen and checked against the control it claims to open.
- I compared the names, IDs, dates, amounts and people across screens as one story.
- Settings screens 24–37 were reviewed for structure and consistency, not word by word.

This review covers what the prototype *shows*. It does not cover behaviour, accessibility conformance or performance.

## Verdict

The direction is right and worth keeping: a calm light workspace, a floating rail, one case seen through seven lenses, connected-object maps, and visible contrary material and uncertainty. These ideas are what make EvidenceSpace distinctive.

Today the screens are held back by five systemic problems, not by the concept:

1. many click areas open the wrong place;
2. the demo case contradicts itself across screens;
3. the copy reads like system or AI-written text;
4. type is too small and every card carries too many labels and pills;
5. navigation and page frames differ from screen to screen.

Fixing these five, then adding a few signature interactions, gets us to v2 without losing the character.

## Keep

- Floating rail, top bar and main frame geometry; the light atmospheric background.
- The seven case lenses: Brief, Space, Evidence, Research, Work, Room, Reports.
- The connection map: typed cards joined by labelled lines. It is the product's visual signature.
- Evidence viewer: the original document stays central, highlights sit on top, and the record sits beside it.
- New case Story Field: free writing on the left with structure appearing live on the right. This is the most original idea in the set.
- Booking with item-by-item sharing and "Preview as lawyer".
- Notification lifecycle: toast, system notice, drawer, full page, then the exact object.
- Palette roles: blue for action, teal for confirmed, coral for contrary, amber for unknown.

## Systemic issues

### A. Click-through errors

- **Rail click areas are offset on 31 screens.** Measured against the rail icons:
  - "Find a lawyer" covers the Bell;
  - "Global notifications" covers empty rail below the Bell;
  - "Settings" covers the avatar rather than the gear;
  - the shield (security/help) has no click area.
- **Contextual click areas reuse generic positions instead of their controls.** Examples:
  - Home: "Create new case" covers the "Three things need you" heading, not the New case button. "Open Harbor Studio" covers the map, so "Resume Case Space" goes to Brief, not Space. "Open overview", the case rows and Quick start have no click areas.
  - Cases: "New case" covers the count pills, not the button.
  - Brief: "Evidence E-04" covers the R-02 research card. "Research R-02" covers Unresolved questions. "Recommended work" covers the Needs attention list, not "Review source".
  - Evidence: "Back to relation F-03" covers the zoom controls. "Official research R-02" covers Confirm/Correct. "Open exact object from notification" covers empty space.
  - Research: "Linked evidence E-04" covers the source-check table. "Map relation in Space" covers a list row. "Add sourced task" covers the AI note.
  - Work: "Linked Evidence" covers the Due today pill. "Discuss in Room" covers the checklist.
  - Room: "Prepare report" covers the shared draft card.
- **Case-tab click areas drift right.** The Reports area sits over empty bar space.
- **`returnTo` is a fixed chain** (Evidence → Space, Research → Evidence, Work → Research, and so on) rather than the page the user came from. That contradicts the exact-return contract.

**Rule for v2:** every interactive element is a real control. The image-hotspot technique is retired in favour of the coded shell.

### B. The demo case contradicts itself

The data is fictional, but it is the story every reviewer, tester and future user reads. In an evidence product, contradictions look like bugs.

| Topic | Conflicting values |
| --- | --- |
| Signed-in person | Home "Good afternoon, Alex"; Settings profile "Morgan Ellis (ME)"; avatar "NA" on most screens and "ME" on some; E-04 is addressed to "Alex Morgan" |
| Lawyer | "Alex Chen", a third Alex |
| Collaborators | Room shows "Riley Morgan" and "Jordan Kim"; Workspace members shows "Riley Chen" and "Sam Rivera"; notifications mention "Priya Singh", who appears nowhere else |
| Amount owed | £4,800 in Story Field and Brief; Space shows "E-03 · £12,500 due 1 August" |
| Invoice | Evidence: `Invoice-4817.pdf`; Booking: "Invoice #204" |
| E-02 / E-03 | Evidence: E-02 invoice, E-03 delivery acknowledgement. Space: E-02 email "Received, thank you", E-03 invoice. Booking: E-02 invoice, E-03 delivery record |
| Delivery date | Space timeline: 18 Jul. Reports chronology: 30 Jul |
| Invoice due date | New case lists it as unknown; Space "1 August"; Reports "17 Aug"; Work task "Confirm invoice due date" due 30 Aug |
| ID prefixes | `R-` means Research (R-02) and also Reports (notification "Reports · R-03"; the catalogue uses RP-01). Work uses W-01 and also T-12 |
| Counts | Evidence header "18 sources" against 6 listed. Brief "3 original sources". Booking "6 total" lenses while showing 7 |
| Workspace label | Top bar alternates between "Alder Workspace", "EvidenceSpace · Professional support", "Harbor Studio payment dispute" and "Harbor Studio · Payment dispute" |

**Rule for v2:** one written *case bible* (see the proposal below) is the only source of fixture names, IDs, dates and amounts.

### C. Language reads as system- or AI-written

- **Architecture words used as interface copy:** provenance, continuity, "Quiet continuity", "Live case seed", "Story anchors", "Signal Field relation", "Exact connection", "Context kept", "Trace preserved", "Mute boundary", "Non-negotiable safety", "connected objects", "reviewed understanding".
- **The "not X, Y" pattern on almost every screen:** "Descriptive, not predictive", "Coverage, not confidence", "not a completion score", "not ranked by popularity", "directory order is not an outcome prediction", "AI works in the margins—not as another chat transcript". One disclaimer is honest; twenty read as defensive and machine-written.
- **An uppercase eyebrow above every heading and card** (CASE BRIEF, WORKSPACE LIBRARY, TRACEABLE OUTPUTS, SOURCE LIBRARY, RESEARCH FIELD, VERIFIED PROFESSIONAL DIRECTORY…). This is a template tell, and it doubles the label count.
- **"AI" appears as a label dozens of times:** AI PROPOSAL · NOT APPLIED, AI GHOST, AI inferred, AI draft, AI lens, Private AI, AI relevance note, Shared case AI draft.
- **Sign-in jargon:** "Authenticate before any workspace, case name, invitation detail, or recent activity is displayed."

**Rule for v2:**
- Write the way a careful person would explain it across a desk.
- One disclaimer per page at most, placed where the risk is.
- Use eyebrows only where they help orientation, not on every card.
- Show assistant output with one consistent visual treatment and a plain word ("Suggestion"), not repeated "AI" labels. The final term is a decision for the owner (see Decisions).

### D. Density and type

- At 1920×1080, much secondary text renders around 8–10 px. Card notes, table headers and pill labels are hard to read at the delivery size.
- A typical card stacks eyebrow, title, note, status pill, count pill and link. Status often repeats in two or three places (Work: "6 open · 3 need you · 1 AI proposal" in the header, then "1 due today · 1 proposed · 4 connected lenses" one row below).
- Page titles compete with a second title-sized sentence (the Brief headline), so the hierarchy flattens.

**Rule for v2:**
- 14 px minimum body text and 12 px minimum for labels.
- One status location per object.
- At most two pills per card.
- Keep the page title, section title and object title as three clear levels.

### E. Navigation and frame consistency

- Home and Cases show top tabs (Home · Cases · Lawyers) that duplicate the rail.
- Settings has two different left menus:
  - screens 24–28: a flat 8-item menu without "AI & guidance", "Workspace & members" or "Workspace history";
  - screens 29–37: a grouped 11-item menu.
- The Space top bar uses a different title format and avatar order from the other case lenses.
- Onboarding shows progress three times at once: top stepper, "Step 1 of 5" pill and the right "Your setup" list.
- New case shows two progress systems: Describe/Locate/Organize/Review across the top and Situation/Agreement/Delivery/Dispute down the side.

**Rule for v2:**
- The rail owns global destinations.
- The top bar owns context (workspace or case), case lenses, search and people.
- Settings has one grouped menu.
- Each flow has one progress indicator.

### F. Collisions and empty space

- **Space:** the floating "Ask about this selection" bar covers the timeline between 18 Jul and 2 Aug.
- **Work:** action-path cards overlap ("Approve before sending" is clipped; "Confirm acceptance timeline" sits under the proposal card).
- **Room:** the "Case conversations" header crowds the room search field.
- **Large unused areas:**
  - the lower halves of Sign-in (both columns), Brief left, Story Field, Lawyer profile left, All notifications list and detail, and Help & support;
  - most of the canvas on Settings screens with short content.
- **Welcome:** the stage is clipped at the initial 1920×1080 view (already recorded).

**Rule for v2:** fill space with the next useful thing or let the layout breathe on purpose. No filler cards.

## Screen notes

| # | Screen | Main notes |
| ---: | --- | --- |
| 1 | Welcome | Strong headline. The map is decorative here; let it show the real loop (source → fact → question → action). Shorten the right column copy. Both columns have empty lower halves. |
| 2–6 | Onboarding | Clean. Drop the duplicate progress. Age is sensitive: explain once, keep it optional where the law allows. Step 6 should hand straight into the real New case Story Field. |
| 7 | Home | Good resume card. Fix the name. The rows, Quick start and "Open overview" need real targets. "What needs attention?" duplicates search. |
| 8 | Cases | Good. The pinned Northbridge card reuses Harbor's map; give each case its own. Avoid three count pill groups. |
| 9 | New case | Most original screen. Merge the two progress systems. Replace "AI works in the margins…" with plain copy. |
| 10 | Brief | Headline too large. "Case path" and "Three questions" are useful. "Needs attention" overlaps Home's list. |
| 11 | Space | Signature screen. Fix the timeline collision and top-bar format. Use the full-height inspector only on selection. |
| 12 | Evidence | Best composition. Fix counts and the E-ID scheme. Consider keeping only the record panel when an object is open. |
| 13 | Research | Good separation of official sources. The landscape map and list say the same thing; let one lead. |
| 14 | Work | Remove the "AI" assignee avatar (assistant output is not a team member). Fix the overlapping action path. |
| 15 | Room | Good human-first thread. The decision checkpoint is a strong pattern; reuse it. |
| 16 | Reports | Strong review gate. Reconcile chronology dates. |
| 17–18 | Lawyers | Clear and trustworthy. Rename the lawyer (not Alex). "Next 9" pagination label is odd. |
| 19 | Booking | Good item-by-item sharing. Lens count says 6, shows 7. |
| 20–23 | Notifications | Coherent lifecycle. All notifications has a large empty lower area. IDs need the scheme fix. |
| 24–37 | Settings | Unify the menu. Many pages are mostly empty canvas; a two-column form layout with a live preview only where it matters (Appearance, Notifications, Privacy) would read better. |

## Proposed v2 direction

Refine, not replace. Seven moves:

1. **One system, coded once.** Turn the prototype into a tokenized component set (rail, top bar, page header, card, object chip, status, connection map, inspector, decision checkpoint, review gate) and build every screen from it.
2. **Readable at delivery size.** New type scale (title 28, section 18, object 15, body 14, label 12), fewer pills and eyebrows, more alignment.
3. **One case bible.** Every name, ID, date and amount comes from one fixture file.
4. **Plain, human copy.** A copy pass on every screen with the rules in section C.
5. **The connection map as signature.** One map component with consistent card shapes and four line types (supports, contradicts, open question, suggestion). It appears identically on Welcome, Home, Cases, Brief, New case and Space, and grows into the full board in Space.
6. **Motion that explains where things went.**
   - The selected object card travels from the Brief map into Space or Evidence (shared-element transition).
   - A new fact visibly settles into the map when confirmed.
   - Contrary material keeps its coral edge everywhere.
   - Reduced-motion versions are instant.
7. **A persistent case timeline ribbon.** In disputes, dates are the backbone. A thin, collapsible timeline under the case top bar keeps key dates visible across all seven lenses and doubles as navigation.

## Case bible proposal

To be confirmed by the owner before fixtures change:

- **User:** Alex Morgan, independent designer, "Alder Workspace", initials AM.
- **Client / other party:** Harbor Studio (contact Mia Collins).
- **Collaborators:** Riley Morgan (RM, editor) and Jordan Kim (JK, commenter).
- **Lawyer:** a non-Alex name, for example "Hana Chen".
- **Money:** one invoice, `Invoice-4817.pdf`, £4,800.
- **Evidence:**
  - E-01 Agreement (14 May, 14-day payment term)
  - E-02 Invoice 4817
  - E-03 Delivery acknowledgement
  - E-04 2 August email
  - E-05 Mobile layout note
  - E-06 Call summary
- **Dates:** one delivery date, one invoice date and one due date, used everywhere.
- **ID prefixes:** E- evidence, R- research, W- work, T- thread, RP- report, B- booking, N- notification.

## Decisions needed

1. Confirm or change the case bible above.
2. Choose the word used for assistant output in the interface: "Suggestion", "Draft" or another plain term. Also decide whether "AI" appears at all outside Settings and disclosure text.
3. Approve the v2 type scale and density rules before screen work starts.

## Next steps

1. Owner decisions above.
2. Write the case bible fixture and the v2 tokens and components.
3. Rebuild Home, Cases, Brief, Space and Evidence on v2. Compare each beside its source screen.
4. Continue lens by lens, then onboarding, notifications and Settings.

Trust-preserving CaseFind migration (`HANDOFF.md`) stays queued behind this design pass.
