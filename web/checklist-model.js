export const CHECKLIST_ITEMS = [
  { key: "agreement", title: "Project agreement or proposal", description: "Scope, price, or original terms" },
  { key: "price", title: "Agreed price and payment schedule", description: "Messages or documents showing the amount" },
  { key: "invoice", title: "Invoice", description: "The amount requested and payment details" },
  { key: "delivery", title: "Proof the work was delivered", description: "Email, link, or transfer confirmation" },
  { key: "approval", title: "Client approval or feedback", description: "Acceptance, review, or change requests" },
  { key: "reminders", title: "Payment reminders and responses", description: "Follow-ups and the client’s replies" },
];

export const CHECKLIST_STATUSES = ["found", "missing", "needs_review", "not_applicable"];
const STATUS_SET = new Set(CHECKLIST_STATUSES);
const ITEM_KEYS = new Set(CHECKLIST_ITEMS.map((item) => item.key));

export function checklistState(record = {}, key) {
  const explicit = record.checklistStates?.[key];
  if (STATUS_SET.has(explicit)) return explicit;
  return Array.isArray(record.checklist) && record.checklist.includes(key) ? "found" : "missing";
}

export function checklistEntries(record = {}) {
  return CHECKLIST_ITEMS.map((item) => ({ ...item, status: checklistState(record, item.key) }));
}

export function checklistStats(record = {}) {
  const entries = checklistEntries(record);
  const result = { total: entries.length, found: 0, missing: 0, needsReview: 0, notApplicable: 0, reviewed: 0 };
  for (const entry of entries) {
    if (entry.status === "found") result.found += 1;
    else if (entry.status === "needs_review") result.needsReview += 1;
    else if (entry.status === "not_applicable") result.notApplicable += 1;
    else result.missing += 1;
  }
  result.reviewed = result.found + result.notApplicable;
  return result;
}

export function setChecklistState(record = {}, key, status, at = new Date().toISOString()) {
  if (!ITEM_KEYS.has(key)) return { ok: false, error: "Unknown checklist category." };
  if (!STATUS_SET.has(status)) return { ok: false, error: "Choose a valid checklist status." };
  const checklistStates = Object.fromEntries(
    CHECKLIST_ITEMS.map((item) => [item.key, item.key === key ? status : checklistState(record, item.key)]),
  );
  const checklist = CHECKLIST_ITEMS
    .filter((item) => checklistStates[item.key] === "found")
    .map((item) => item.key);
  return {
    ok: true,
    value: { ...record, checklistStates, checklist, updatedAt: at },
  };
}
