import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stableTriggerSelector = ".workspace-topline > .button-secondary:not(.backup-trigger)";

test("report and backup modules cannot claim each other's trigger", async () => {
  const [reportUi, backupUi] = await Promise.all([
    readFile(new URL("../web/report-ui.js", import.meta.url), "utf8"),
    readFile(new URL("../web/backup-ui.js", import.meta.url), "utf8"),
  ]);
  assert.match(reportUi, new RegExp(stableTriggerSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(backupUi, new RegExp(stableTriggerSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(reportUi.includes('document.querySelector(".workspace-topline .button-secondary")'), false);
  assert.equal(backupUi.includes('document.querySelector(".workspace-topline .button-secondary")'), false);
});
