import assert from "node:assert/strict";
import test from "node:test";
import { calculateRecordReadiness } from "../web/readiness-model.js";

const states = {
  agreement: "found", price: "found", invoice: "missing", delivery: "needs_review",
  approval: "not_applicable", reminders: "not_applicable",
};

test("readiness scores reviewed and not-applicable checklist states transparently", () => {
  const result = calculateRecordReadiness({ record: { checklistStates: states }, files: [], facts: [], suggestions: [] });
  const component = result.components.find((item) => item.key === "checklist");
  assert.equal(component.score, 20);
  assert.match(component.detail, /2 found · 1 needs review · 1 missing · 2 not applicable/);
  assert.equal(result.checklist.reviewed, 4);
  assert.ok(result.nextSteps.some((step) => step.includes("marked needs review")));
});

test("fully reviewed not-applicable categories do not remain false missing gaps", () => {
  const checklistStates = Object.fromEntries(Object.keys(states).map((key) => [key, "not_applicable"]));
  const result = calculateRecordReadiness({ record: { checklistStates }, files: [], facts: [], suggestions: [] });
  const component = result.components.find((item) => item.key === "checklist");
  assert.equal(component.score, 30);
  assert.equal(result.checklist.missing, 0);
  assert.equal(result.nextSteps.some((step) => step.includes("checklist categor")), false);
});

test("legacy checklist arrays retain their existing readiness score", () => {
  const result = calculateRecordReadiness({ record: { checklist: ["invoice", "delivery", "approval"] }, files: [], facts: [], suggestions: [] });
  assert.equal(result.components.find((item) => item.key === "checklist").score, 15);
});
