import assert from "node:assert/strict";
import test from "node:test";
import type { CaseRecord } from "../src/domain/case.js";
import { canConfirm, hasValidProvenance } from "../src/domain/case.js";
import { calculateReadiness } from "../src/domain/readiness.js";

function makeCase(): CaseRecord {
  return {
    id: "case-1",
    type: "unpaid_freelance_work",
    title: "ABC Studio payment",
    status: "reviewing",
    goal: "Prepare a payment-dispute record",
    summary: "Website design delivered but final payment remains unpaid.",
    checklist: [
      { id: "c1", key: "agreement", label: "Agreement", status: "found", weight: 3 },
      { id: "c2", key: "delivery", label: "Delivery proof", status: "found", weight: 3 },
      { id: "c3", key: "approval", label: "Client approval", status: "needs_review", weight: 2 },
      { id: "c4", key: "late_clause", label: "Late-payment clause", status: "not_applicable", weight: 1 }
    ],
    facts: [],
    events: [],
    conflicts: []
  };
}

test("readiness excludes not-applicable checklist items", () => {
  const result = calculateReadiness(makeCase());
  assert.equal(result.completedWeight, 6);
  assert.equal(result.totalApplicableWeight, 8);
  assert.equal(result.score, 75);
});

test("readiness penalizes unresolved conflicts and unverified items", () => {
  const record = makeCase();
  record.conflicts.push({ id: "conflict-1", caseId: record.id, label: "Amount differs", factIds: ["f1", "f2"], resolved: false });
  record.facts.push({ id: "f1", caseId: record.id, label: "Amount", value: "30000", status: "suggested", confidence: 0.8, sourceReferences: [], manuallyEntered: false });
  const result = calculateReadiness(record);
  assert.equal(result.score, 68);
  assert.equal(result.unresolvedConflictCount, 1);
  assert.equal(result.unverifiedItemCount, 1);
});

test("confirmed information requires provenance or explicit manual entry", () => {
  const extracted = { id: "f1", caseId: "case-1", label: "Amount", value: "30000", status: "suggested" as const, sourceReferences: [], manuallyEntered: false };
  assert.equal(hasValidProvenance(extracted), false);
  assert.equal(canConfirm(extracted), false);

  const manual = { ...extracted, manuallyEntered: true };
  assert.equal(hasValidProvenance(manual), true);
  assert.equal(canConfirm(manual), true);
});
