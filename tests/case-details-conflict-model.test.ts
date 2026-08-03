import assert from "node:assert/strict";
import test from "node:test";
import { applyCaseDetails } from "../web/case-details-model.js";

const input = { title: "Updated case", client: "Client Ltd", amount: "USD 1,200", summary: "A sufficiently detailed description of what happened in this payment dispute.", goal: "request" };

test("case detail updates reject missing records", () => {
  const result = applyCaseDetails(null, input, "2026-08-03T00:00:00Z", "old");
  assert.equal(result.ok, false);
  assert.match(result.error, /no longer available/);
});

test("case detail updates reject stale editor versions", () => {
  const record = { id: "case-1", title: "Current", updatedAt: "new-version", checklist: ["invoice"] };
  const result = applyCaseDetails(record, input, "2026-08-03T00:00:00Z", "old-version");
  assert.equal(result.ok, false);
  assert.match(result.error, /changed in another tab/);
  assert.equal(record.title, "Current");
  assert.deepEqual(record.checklist, ["invoice"]);
});
