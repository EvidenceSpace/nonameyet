import assert from "node:assert/strict";
import test from "node:test";
import { checklistEntries, checklistState, checklistStats, setChecklistState } from "../web/checklist-model.js";

const allKeys = ["agreement", "price", "invoice", "delivery", "approval", "reminders"];

test("legacy checked categories migrate as found without losing compatibility", () => {
  const legacy = { checklist: ["invoice", "delivery"] };
  assert.equal(checklistState(legacy, "invoice"), "found");
  assert.equal(checklistState(legacy, "agreement"), "missing");
  const result = setChecklistState(legacy, "approval", "needs_review", "2026-07-29T12:00:00Z");
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.checklist, ["invoice", "delivery"]);
  assert.equal(result.value.checklistStates.approval, "needs_review");
  assert.equal(Object.keys(result.value.checklistStates).length, 6);
});

test("all four explicit states are counted transparently", () => {
  const record = { checklistStates: {
    agreement: "found", price: "found", invoice: "missing", delivery: "needs_review",
    approval: "not_applicable", reminders: "not_applicable",
  } };
  const stats = checklistStats(record);
  assert.deepEqual(stats, { total: 6, found: 2, missing: 1, needsReview: 1, notApplicable: 2, reviewed: 4 });
  assert.equal(checklistEntries(record).length, 6);
});

test("state changes preserve exact found-only export compatibility", () => {
  let record = { checklist: [...allKeys] };
  record = setChecklistState(record, "invoice", "not_applicable", "now").value;
  assert.equal(record.checklist.includes("invoice"), false);
  assert.equal(record.checklistStates.invoice, "not_applicable");
  record = setChecklistState(record, "invoice", "found", "later").value;
  assert.equal(record.checklist.includes("invoice"), true);
  assert.equal(record.updatedAt, "later");
});

test("unknown categories and statuses fail closed", () => {
  assert.deepEqual(setChecklistState({}, "unknown", "found"), { ok: false, error: "Unknown checklist category." });
  assert.deepEqual(setChecklistState({}, "invoice", "probably"), { ok: false, error: "Choose a valid checklist status." });
});
