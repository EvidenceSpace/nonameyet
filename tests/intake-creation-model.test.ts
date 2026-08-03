import assert from "node:assert/strict";
import test from "node:test";
import { buildCaseCreationDraft, describeCaseCreationFailure } from "../web/intake-creation-model.js";

test("creates one stable local draft identity", () => {
  const draft = buildCaseCreationDraft({ title: "First", client: "Client", amount: "100", summary: "A sufficiently long summary for this draft.", goal: "understand" }, undefined, { createId: () => "case_stable", now: () => "2026-08-03T10:00:00.000Z" });
  assert.equal(draft.id, "case_stable");
  assert.equal(draft.createdAt, "2026-08-03T10:00:00.000Z");
  assert.equal(draft.localStorageAcknowledgedAt, draft.createdAt);
});

test("retries preserve identity and creation time while accepting corrections", () => {
  const first = buildCaseCreationDraft({ title: "First", client: "Client", amount: "100", summary: "A sufficiently long summary for this draft.", goal: "understand" }, undefined, { createId: () => "case_stable", now: () => "2026-08-03T10:00:00.000Z" });
  const retry = buildCaseCreationDraft({ ...first, title: "Corrected title" }, first, { createId: () => "case_wrong", now: () => "2026-08-03T10:05:00.000Z" });
  assert.equal(retry.id, "case_stable");
  assert.equal(retry.createdAt, first.createdAt);
  assert.equal(retry.localStorageAcknowledgedAt, first.localStorageAcknowledgedAt);
  assert.equal(retry.updatedAt, "2026-08-03T10:05:00.000Z");
  assert.equal(retry.title, "Corrected title");
});

test("blocked upgrades explain the safe retry without sacrificing entries", () => {
  const failure = describeCaseCreationFailure({ code: "upgrade_blocked" });
  assert.equal(failure.state, "blocked");
  assert.match(failure.detail, /entries are still here/);
  assert.match(failure.instruction, /Close every other CaseFind tab/);
  assert.match(failure.instruction, /Do not clear browser site data/);
});

test("unknown failures stay cautious and non-destructive", () => {
  const failure = describeCaseCreationFailure(new Error("quota"));
  assert.equal(failure.state, "unavailable");
  assert.match(failure.detail, /Nothing was changed or deleted/);
  assert.match(failure.instruction, /storage permissions/);
  assert.equal(failure.retryLabel, "Try saving again");
});
