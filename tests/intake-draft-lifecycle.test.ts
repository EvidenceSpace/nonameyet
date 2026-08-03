import assert from "node:assert/strict";
import test from "node:test";
import { describeIntakeDraftLifecycle, hasMeaningfulIntakeDraft, shouldWarnBeforeIntakeExit } from "../web/intake-draft-lifecycle.js";

test("default intake values are not treated as an unsaved draft", () => {
  assert.equal(hasMeaningfulIntakeDraft({ goal: "understand" }), false);
  assert.equal(shouldWarnBeforeIntakeExit({ hasDraft: false }), false);
  assert.equal(describeIntakeDraftLifecycle({ hasDraft: false }).state, "pristine");
});

test("any user-entered case detail becomes an explicit unsaved draft", () => {
  for (const value of [{ title: "Draft" }, { client: "Client" }, { amount: "20,000" }, { summary: "Started entering facts" }, { goal: "request" }, { acknowledged: true }]) {
    assert.equal(hasMeaningfulIntakeDraft(value), true);
  }
  const state = describeIntakeDraftLifecycle({ hasDraft: true });
  assert.equal(state.state, "unsaved");
  assert.match(state.message, /leaving this page will discard/);
});

test("whitespace-only input does not create a false navigation warning", () => {
  assert.equal(hasMeaningfulIntakeDraft({ title: "  ", client: "\n", amount: "", summary: "\t" }), false);
});

test("saved drafts can leave while unsaved and saving drafts stay protected", () => {
  assert.equal(shouldWarnBeforeIntakeExit({ hasDraft: true, saved: false }), true);
  assert.equal(shouldWarnBeforeIntakeExit({ hasDraft: true, saved: true }), false);
  assert.equal(describeIntakeDraftLifecycle({ hasDraft: true, creating: true }).state, "saving");
  assert.equal(describeIntakeDraftLifecycle({ hasDraft: true, saved: true }).state, "saved");
});
