const freezeList = (items) => Object.freeze(items.map((item) => Object.freeze(item)));

export const workspaceFixture = Object.freeze({
  id: "W-01",
  name: "Alder Workspace",
  owner: "Alex Morgan",
  firstName: "Alex",
  updates: 4,
  synchronized: true,
});

export const caseFixture = Object.freeze({
  id: "C-03",
  title: "Harbor Studio payment dispute",
  shortTitle: "Harbor Studio",
  type: "Civil",
  jurisdiction: "England & Wales",
  focus: "Acceptance timing",
  status: "Review",
  updated: "8m",
  connectedObjects: 7,
  members: freezeList([
    { initials: "NA", name: "Nora Ahmed" },
    { initials: "RM", name: "Riley Morgan" },
    { initials: "JK", name: "Jordan Kim" },
  ]),
  summary: "Current sources show delivery was acknowledged before a quality concern was raised. £4,800 remains unpaid. Review the 2 August email before sending a formal request.",
  supportCount: 4,
  contraryCount: 1,
  unknownCount: 3,
});

export const casesFixture = freezeList([
  {
    id: "C-03",
    title: "Harbor Studio payment dispute",
    type: "Civil",
    jurisdiction: "England & Wales",
    focus: "Acceptance timing",
    status: "Review",
    action: "Review 2 August email",
    updated: "8m",
    members: 3,
    connectedObjects: 7,
    tone: "contrary",
    pinned: true,
  },
  {
    id: "C-07",
    title: "Northbridge deposit recovery",
    type: "Housing",
    jurisdiction: "Ontario",
    focus: "Deposit return requirements",
    status: "AI draft",
    action: "Approve document request",
    updated: "1h",
    members: 3,
    connectedObjects: 7,
    tone: "ai",
    pinned: true,
  },
  {
    id: "C-11",
    title: "Rivera learning simulation",
    type: "Education workspace",
    jurisdiction: "Simulation",
    focus: "Payment chronology",
    status: "Organized",
    action: "Continue timeline",
    updated: "Tue",
    members: 1,
    connectedObjects: 5,
    tone: "confirmed",
    pinned: false,
  },
  {
    id: "C-14",
    title: "Tenancy repair matter",
    type: "Housing",
    jurisdiction: "Victoria",
    focus: "Notice requirements",
    status: "Research",
    action: "Review official guidance",
    updated: "Wed",
    members: 2,
    connectedObjects: 4,
    tone: "uncertain",
    pinned: false,
  },
]);

export const todayFixture = freezeList([
  { time: "10:30", title: "Review contrary email", caseTitle: "Harbor Studio", icon: "comment", tone: "contrary" },
  { time: "13:00", title: "Approve document request", caseTitle: "Northbridge", icon: "spark", tone: "ai" },
  { time: "16:30", title: "Check research freshness", caseTitle: "Tenancy repair", icon: "shield", tone: "confirmed" },
]);

export const evidenceFixture = freezeList([
  { id: "E-04", kind: "Email", title: "2-August-email.eml", owner: "Riley", date: "2 Aug", size: "24 KB", state: "Contrary", tone: "contrary", needsReview: true },
  { id: "E-05", kind: "Image", title: "mobile-layout-note.png", owner: "You", date: "3 Aug", size: "1.5 MB", state: "Unreviewed", tone: "uncertain", needsReview: true },
  { id: "E-01", kind: "PDF", title: "Harbor-Agreement.pdf", owner: "You", date: "14 May", size: "1.2 MB", state: "Original", tone: "confirmed", needsReview: false },
  { id: "E-02", kind: "PDF", title: "Invoice-4817.pdf", owner: "You", date: "27 Jul", size: "358 KB", state: "Original", tone: "confirmed", needsReview: false },
  { id: "E-03", kind: "PDF", title: "Delivery-acknowledgement.pdf", owner: "Riley", date: "29 Jul", size: "216 KB", state: "Confirmed", tone: "action", needsReview: false },
  { id: "E-06", kind: "Note", title: "Call summary · 5 August", owner: "You", date: "5 Aug", size: "Case note", state: "Confirmed", tone: "action", needsReview: false },
]);

export const selectedEvidenceFixture = Object.freeze({
  id: "E-04",
  title: "Quality concern email",
  filename: "2-August-email.eml",
  kind: "Original email message (.eml)",
  source: "Client email thread",
  date: "2 August 2026 · 10:14",
  imported: "2 August 2026 · 10:22",
  addedBy: "Riley Morgan",
  integrity: "Checksum recorded",
  visibility: "Case members",
  backlinks: 3,
  assessment: "The first written objection follows the recorded delivery and acknowledgement. Earlier communication remains unknown.",
  statements: freezeList([
    { id: "A1", label: "Receipt", quote: "We received the final package on Friday.", tone: "confirmed", state: "Ready" },
    { id: "A2", label: "Concern", quote: "I do have concerns about some of the mobile layouts.", tone: "contrary", state: "Contrary" },
  ]),
});

export const briefAttentionFixture = freezeList([
  { title: "Request change log", detail: "AI-proposed task · not applied", tone: "ai", status: "Review" },
  { title: "Payment request review", detail: "Planned for 2 September", tone: "uncertain", status: "Upcoming" },
  { title: "Riley asked a question", detail: "Is the invoice due date confirmed?", tone: "action", status: "Comment" },
]);
