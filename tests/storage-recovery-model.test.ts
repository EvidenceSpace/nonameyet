import assert from "node:assert/strict";
import test from "node:test";
import { describeStorageRecovery } from "../web/storage-recovery-model.js";

test("gives blocked upgrades a precise non-destructive recovery path", () => {
  const state = describeStorageRecovery({ code: "upgrade_blocked" });
  assert.equal(state.state, "blocked");
  assert.match(state.title, /Close other CaseFind tabs/);
  assert.match(state.detail, /not changed/);
  assert.match(state.instruction, /Do not clear browser site data/);
});

test("keeps unknown storage failures cautious and actionable", () => {
  const state = describeStorageRecovery(new Error("private mode"));
  assert.equal(state.state, "unavailable");
  assert.match(state.detail, /Nothing was changed or deleted/);
  assert.match(state.instruction, /storage permissions/);
  assert.match(state.instruction, /Do not clear site data/);
});
