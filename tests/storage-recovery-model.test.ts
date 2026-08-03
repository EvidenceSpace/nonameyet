import assert from "node:assert/strict";
import test from "node:test";
import { describeStorageRecovery } from "../web/storage-recovery-model.js";

test("gives blocked library upgrades a precise non-destructive recovery path", () => {
  const state = describeStorageRecovery({ code: "upgrade_blocked" });
  assert.equal(state.state, "blocked");
  assert.match(state.title, /Close other CaseFind tabs/);
  assert.match(state.detail, /local cases were not changed/);
  assert.match(state.instruction, /Do not clear browser site data/);
  assert.equal(state.retryLabel, "Retry opening cases");
});

test("uses singular workspace recovery language", () => {
  const state = describeStorageRecovery({ code: "upgrade_blocked" }, { scope: "workspace" });
  assert.match(state.detail, /local case data was not changed/);
  assert.equal(state.retryLabel, "Retry opening case");
});

test("keeps unknown storage failures cautious and actionable", () => {
  const state = describeStorageRecovery(new Error("private mode"), { scope: "workspace" });
  assert.equal(state.state, "unavailable");
  assert.match(state.title, /This case/);
  assert.match(state.detail, /Nothing was changed or deleted/);
  assert.match(state.instruction, /Do not clear site data/);
});
