import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake = readFileSync(new URL("../web/intake.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../web/cases-new.html", import.meta.url), "utf8");

test("installs an explicit unsaved status and before-unload protection", () => {
  assert.match(page, /id="draft-storage-status"/);
  assert.match(page, /intake-draft-lifecycle\.css/);
  assert.match(intake, /window\.addEventListener\("beforeunload"/);
  assert.match(intake, /shouldWarnBeforeIntakeExit/);
});

test("marks creation complete only after local case storage succeeds", () => {
  const saveIndex = intake.indexOf("await saveCase(pendingDraft)");
  const completeIndex = intake.indexOf("creationCompleted = true");
  assert.ok(saveIndex >= 0 && completeIndex > saveIndex);
});

test("explicit restart clears the completed lifecycle", () => {
  const restartIndex = intake.indexOf('querySelector("#restart-button")');
  assert.ok(intake.indexOf("creationCompleted = false", restartIndex) > restartIndex);
});
