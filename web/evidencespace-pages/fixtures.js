/*
 * EvidenceSpace demo case bible.
 * Every name, ID, date, and amount shown by the connected slice comes from
 * this file. All content is fictional. Change it here, never inline in a page.
 */
const freezeList = (items) => Object.freeze(items.map((item) => Object.freeze(item)));

export const peopleFixture = Object.freeze({
  user: Object.freeze({ initials: "AM", name: "Alex Morgan", firstName: "Alex", role: "Owner", email: "alex@alder.design" }),
  riley: Object.freeze({ initials: "RS", name: "Riley Shah", firstName: "Riley", role: "Editor" }),
  jordan: Object.freeze({ initials: "JK", name: "Jordan Kim", firstName: "Jordan", role: "Commenter" }),
  otherParty: Object.freeze({ name: "Mia Collins", organization: "Harbor Studio", email: "mia@harborstudio.co.uk" }),
  lawyer: Object.freeze({ initials: "HC", name: "Hana Chen" }),
});

export const workspaceFixture = Object.freeze({
  id: "WS-01",
  name: "Alder Workspace",
  kind: "Personal workspace",
  owner: peopleFixture.user.name,
  firstName: peopleFixture.user.firstName,
  initials: peopleFixture.user.initials,
  today: "Friday 28 August",
  todayShort: "28 Aug",
  updates: 3,
  synchronized: true,
});

export const caseFixture = Object.freeze({
  id: "C-03",
  title: "Harbor Studio payment dispute",
  shortTitle: "Harbor Studio",
  type: "Civil",
  jurisdiction: "England & Wales",
  focus: "Was the work accepted?",
  status: "Review",
  updated: "8 min ago",
  amount: "£4,800",
  members: freezeList([
    { initials: peopleFixture.user.initials, name: peopleFixture.user.name, role: "Owner" },
    { initials: peopleFixture.riley.initials, name: peopleFixture.riley.name, role: "Editor" },
    { initials: peopleFixture.jordan.initials, name: peopleFixture.jordan.name, role: "Commenter" },
  ]),
  summary:
    "Harbor Studio confirmed it received the final work on 31 July, then raised a concern about the mobile layouts on 2 August. The £4,800 invoice was due on 14 August and is still unpaid.",
  nextStep: "Read the 2 August email closely before you send a payment request.",
  supports: freezeList([
    { ref: "E-01", text: "Agreement sets a fixed fee of £4,800, due 14 days after delivery.", tone: "confirmed" },
    { ref: "E-03", text: "Harbor Studio replied “Received, thank you” on 31 July.", tone: "confirmed" },
    { ref: "E-04", text: "The 2 August email says they received the final package.", tone: "confirmed" },
  ]),
  against: freezeList([
    { ref: "E-04", text: "The same email raises concerns about the mobile layouts.", tone: "contrary" },
    { ref: "E-04", text: "It says payment will follow “once the launch is complete”, which the agreement doesn’t mention.", tone: "contrary" },
  ]),
  unknowns: freezeList([
    { text: "Did anyone mention problems before 2 August?" },
    { text: "Does the agreement say what counts as acceptance?" },
    { text: "Was a list of changes ever sent?" },
  ]),
});

export const timelineFixture = freezeList([
  { id: "T1", date: "14 May", label: "Agreement signed", ref: "E-01", tone: "confirmed" },
  { id: "T2", date: "31 Jul", label: "Final work delivered", ref: "E-03", tone: "confirmed" },
  { id: "T3", date: "2 Aug", label: "Concern raised", ref: "E-04", tone: "contrary" },
  { id: "T4", date: "5 Aug", label: "Call with Mia", ref: "E-06", tone: "neutral" },
  { id: "T5", date: "14 Aug", label: "Payment due", ref: "E-02", tone: "uncertain" },
  { id: "T6", date: "28 Aug", label: "Today", ref: null, tone: "today" },
]);

export const casesFixture = freezeList([
  {
    id: "C-03",
    title: "Harbor Studio payment dispute",
    type: "Civil",
    jurisdiction: "England & Wales",
    focus: "Was the work accepted?",
    focusNote: "Check whether the concern came before or after delivery.",
    status: "Needs review",
    action: "Read the 2 August email",
    updated: "8 min ago",
    updatedShort: "8m",
    members: 3,
    tone: "contrary",
    pinned: true,
    needsYou: true,
    shared: true,
  },
  {
    id: "C-07",
    title: "Northbridge deposit recovery",
    type: "Housing",
    jurisdiction: "Ontario",
    focus: "Is the deposit overdue?",
    focusNote: "A letter asking for the deposit is drafted and waiting for you.",
    status: "Draft ready",
    action: "Check the deposit letter",
    updated: "1 hour ago",
    updatedShort: "1h",
    members: 2,
    tone: "ai",
    pinned: true,
    needsYou: false,
    shared: true,
  },
  {
    id: "C-11",
    title: "Rivera practice case",
    type: "Practice",
    jurisdiction: "Fictional",
    focus: "Build a payment timeline",
    focusNote: "Four of six events have a source.",
    status: "Organised",
    action: "Continue the timeline",
    updated: "Tuesday",
    updatedShort: "Tue",
    members: 1,
    tone: "confirmed",
    pinned: false,
    needsYou: false,
    shared: false,
  },
  {
    id: "C-14",
    title: "Tenancy repair request",
    type: "Housing",
    jurisdiction: "Victoria",
    focus: "Which notice applies?",
    focusNote: "Two official guides found, not yet compared.",
    status: "Research",
    action: "Compare the two guides",
    updated: "Wednesday",
    updatedShort: "Wed",
    members: 2,
    tone: "uncertain",
    pinned: false,
    needsYou: false,
    shared: false,
  },
]);

/* Small connection maps. Coordinates are percentages of the map frame. */
export const caseMapsFixture = Object.freeze({
  "C-03": Object.freeze({
    nodes: freezeList([
      { id: "E-01", kind: "source", tag: "E-01 · Agreement", title: "14-day payment term", x: 4, y: 9 },
      { id: "E-04", kind: "contrary", tag: "E-04 · Contradicts", title: "Layout concern", x: 60, y: 7 },
      { id: "Q-1", kind: "focus", tag: "Open question", title: "Was the work accepted?", x: 30, y: 39 },
      { id: "R-02", kind: "research", tag: "R-02 · Guidance", title: "Late payment interest", x: 60, y: 71 },
      { id: "S-1", kind: "suggestion", tag: "Suggested", title: "Ask for the changes list", x: 4, y: 71 },
    ]),
    edges: freezeList([
      { from: "E-01", to: "Q-1", type: "supports" },
      { from: "E-04", to: "Q-1", type: "contradicts" },
      { from: "R-02", to: "Q-1", type: "research" },
      { from: "S-1", to: "Q-1", type: "suggestion" },
    ]),
  }),
  "C-07": Object.freeze({
    nodes: freezeList([
      { id: "E-01", kind: "source", tag: "E-01 · Lease", title: "Deposit terms", x: 4, y: 10 },
      { id: "Q-1", kind: "focus", tag: "Open question", title: "Is the deposit overdue?", x: 32, y: 42 },
      { id: "R-01", kind: "research", tag: "R-01 · Guidance", title: "Return deadline", x: 60, y: 9 },
      { id: "S-1", kind: "suggestion", tag: "Draft · not sent", title: "Deposit letter", x: 60, y: 71 },
    ]),
    edges: freezeList([
      { from: "E-01", to: "Q-1", type: "supports" },
      { from: "R-01", to: "Q-1", type: "research" },
      { from: "S-1", to: "Q-1", type: "suggestion" },
    ]),
  }),
});

export const todayFixture = freezeList([
  { time: "10:30", title: "Read the 2 August email", caseId: "C-03", caseTitle: "Harbor Studio", icon: "comment", tone: "contrary" },
  { time: "13:00", title: "Check the deposit letter", caseId: "C-07", caseTitle: "Northbridge", icon: "file", tone: "ai" },
  { time: "16:30", title: "Compare the two repair guides", caseId: "C-14", caseTitle: "Tenancy repair", icon: "shield", tone: "uncertain" },
]);

export const upcomingFixture = freezeList([
  { date: "2 Sep", title: "Send payment request", caseTitle: "Harbor Studio", tone: "action" },
  { date: "9 Sep", title: "Deposit return deadline", caseTitle: "Northbridge", tone: "uncertain" },
]);

export const evidenceFixture = freezeList([
  { id: "E-04", kind: "Email", title: "2-August-email.eml", label: "Email from Mia, 2 August", owner: "Riley", date: "2 Aug", size: "24 KB", state: "Contradicts", tone: "contrary", needsReview: true },
  { id: "E-05", kind: "Image", title: "mobile-layout-note.png", label: "Screenshot with layout notes", owner: "Riley", date: "3 Aug", size: "1.5 MB", state: "Not reviewed", tone: "uncertain", needsReview: true },
  { id: "E-01", kind: "PDF", title: "Harbor-agreement.pdf", label: "Signed agreement", owner: "You", date: "14 May", size: "1.2 MB", state: "Confirmed", tone: "confirmed", needsReview: false },
  { id: "E-02", kind: "PDF", title: "Invoice-4817.pdf", label: "Invoice 4817", owner: "You", date: "31 Jul", size: "358 KB", state: "Confirmed", tone: "confirmed", needsReview: false },
  { id: "E-03", kind: "Email", title: "Received-thank-you.eml", label: "Reply confirming delivery", owner: "You", date: "31 Jul", size: "12 KB", state: "Confirmed", tone: "confirmed", needsReview: false },
  { id: "E-06", kind: "Note", title: "Call summary · 5 August", label: "Your notes from the call", owner: "You", date: "5 Aug", size: "Note", state: "Confirmed", tone: "confirmed", needsReview: false },
]);

/* Original-document previews. Highlights are overlays; the original never changes. */
export const evidenceDocumentsFixture = Object.freeze({
  "E-04": Object.freeze({
    type: "email",
    heading: "Re: final delivery and invoice",
    from: `${peopleFixture.otherParty.name} <${peopleFixture.otherParty.email}>`,
    to: `${peopleFixture.user.name} <${peopleFixture.user.email}>`,
    sent: "Sunday 2 August 2026, 10:14",
    paragraphs: freezeList([
      { text: "Hi Alex," },
      { parts: [{ mark: "A1", tone: "confirmed", text: "We received the final package on Friday" }, { text: " and have started preparing the launch materials. " }, { mark: "A3", tone: "contrary", text: "We will send payment once the launch is complete." }] },
      { parts: [{ mark: "A2", tone: "contrary", text: "I do have concerns about some of the mobile layouts" }, { text: ", and the team may send a list of changes next week." }] },
      { text: "Thanks,\nMia" },
    ]),
  }),
  "E-03": Object.freeze({
    type: "email",
    heading: "Re: Final files — Harbor Studio site",
    from: `${peopleFixture.otherParty.name} <${peopleFixture.otherParty.email}>`,
    to: `${peopleFixture.user.name} <${peopleFixture.user.email}>`,
    sent: "Friday 31 July 2026, 17:02",
    paragraphs: freezeList([
      { text: "Hi Alex," },
      { parts: [{ mark: "A1", tone: "confirmed", text: "Received, thank you." }, { text: " Everything downloaded fine." }] },
      { text: "Mia" },
    ]),
  }),
  "E-01": Object.freeze({
    type: "document",
    heading: "Design services agreement",
    meta: "Alder Workspace and Harbor Studio · signed 14 May 2026",
    paragraphs: freezeList([
      { text: "3. Scope. Website design for desktop and mobile, delivered as one final package." },
      { parts: [{ text: "4.1 Fee. A fixed fee of £4,800. " }, { mark: "A1", tone: "confirmed", text: "4.2 Payment is due 14 days after delivery of the final package." }] },
      { text: "5. Changes. Change requests after delivery are quoted separately." },
    ]),
  }),
  "E-02": Object.freeze({
    type: "invoice",
    heading: "Invoice 4817",
    meta: "Issued 31 July 2026 · due 14 August 2026",
    rows: freezeList([
      ["Website design — final package", "£4,800.00"],
      ["Total due", "£4,800.00"],
    ]),
  }),
  "E-05": Object.freeze({
    type: "image",
    heading: "mobile-layout-note.png",
    meta: "Sent by Harbor Studio on 3 August",
    caption: "Two notes on the mobile menu and the footer spacing.",
  }),
  "E-06": Object.freeze({
    type: "note",
    heading: "Call with Mia — 5 August",
    meta: "Written by you after the call",
    paragraphs: freezeList([
      { text: "Mia said the launch moved to September." },
      { text: "She will send the list of layout changes “soon”. No list yet." },
      { text: "I reminded her the invoice is due on 14 August." },
    ]),
  }),
});

export const evidenceRecordsFixture = Object.freeze({
  "E-04": Object.freeze({
    title: "Email from Mia, 2 August",
    addedBy: peopleFixture.riley.name,
    added: "2 Aug 2026, 10:22",
    format: "Original email (.eml)",
    integrity: "Matches the original",
    statements: freezeList([
      { id: "A1", label: "Receipt", quote: "We received the final package on Friday.", tone: "confirmed", state: "Supports" },
      { id: "A2", label: "Concern", quote: "I do have concerns about some of the mobile layouts.", tone: "contrary", state: "Contradicts" },
      { id: "A3", label: "Payment condition", quote: "We will send payment once the launch is complete.", tone: "contrary", state: "Contradicts" },
    ]),
    links: freezeList([
      { label: "Brief", detail: "Was the work accepted?", route: "brief", tone: "action" },
      { label: "Space", detail: "Contradicts the open question", route: "space", tone: "contrary" },
      { label: "Work", detail: "W-01 · Read this email · due today", route: "work", tone: "uncertain" },
    ]),
  }),
});

export const selectedEvidenceFixture = Object.freeze({
  id: "E-04",
  title: "Email from Mia, 2 August",
  filename: "2-August-email.eml",
  kind: "Original email (.eml)",
  source: "Email thread with Harbor Studio",
  date: "2 August 2026, 10:14",
  imported: "2 August 2026, 10:22",
  addedBy: peopleFixture.riley.name,
  integrity: "Matches the original",
  visibility: "Case members",
  backlinks: 3,
  assessment:
    "This is the first written concern we have. It arrived two days after Harbor Studio confirmed delivery. We don’t know yet whether anything was said earlier.",
  statements: evidenceRecordsFixture["E-04"].statements,
});

export const briefAttentionFixture = freezeList([
  { title: "Ask for the list of changes", detail: "Suggested step · not added", tone: "ai", status: "Suggested" },
  { title: "Send payment request", detail: "Planned for 2 September", tone: "uncertain", status: "Planned" },
  { title: "Riley left a question", detail: "“Did Mia mention the layouts on the call?”", tone: "action", status: "Comment" },
]);

/* Space board. Positions are pixels on a 1200 × 560 board. */
export const spaceBoardFixture = Object.freeze({
  title: "Was the work accepted?",
  cards: freezeList([
    { id: "E-01", kind: "source", tag: "E-01 · Agreement", title: "Payment due 14 days after delivery", note: "Clause 4.2 · signed 14 May", x: 40, y: 28 },
    { id: "E-03", kind: "source", icon: "mail", tag: "E-03 · Email", title: "“Received, thank you.”", note: "31 July · confirms delivery", x: 40, y: 214 },
    { id: "Q-1", kind: "focus", tag: "Open question", title: "Was the work accepted?", note: "3 support · 2 contradict · 3 unknown", x: 440, y: 184 },
    { id: "E-04", kind: "contrary", icon: "mail", tag: "E-04 · Email", title: "Concern about mobile layouts", note: "2 August · two days after delivery", x: 830, y: 36 },
    { id: "E-06", kind: "note", tag: "E-06 · Your note", title: "No list of changes yet", note: "Call on 5 August", x: 830, y: 262 },
    { id: "R-02", kind: "research", tag: "R-02 · Official guidance", title: "Interest on late payment", note: "GOV.UK · checked 28 Aug", x: 440, y: 412 },
    { id: "S-1", kind: "suggestion", tag: "Suggested · not added", title: "Ask Mia for the list of changes", note: "Would answer one unknown", x: 40, y: 392 },
  ]),
  links: freezeList([
    { from: "E-01", to: "Q-1", type: "supports", label: "Supports" },
    { from: "E-03", to: "Q-1", type: "supports", label: "Supports" },
    { from: "E-04", to: "Q-1", type: "contradicts", label: "Contradicts" },
    { from: "E-06", to: "E-04", type: "question", label: "Open" },
    { from: "R-02", to: "Q-1", type: "research", label: "Guidance" },
    { from: "S-1", to: "Q-1", type: "suggestion", label: "Suggested" },
  ]),
});
