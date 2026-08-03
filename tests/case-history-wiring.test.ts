import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const intake = readFileSync(new URL("../web/intake.js", import.meta.url), "utf8");
const restore = readFileSync(new URL("../web/restore-ui.js", import.meta.url), "utf8");
const library = readFileSync(new URL("../web/cases.html", import.meta.url), "utf8");

test("records local history only after case creation succeeds", () => {
  assert.ok(intake.indexOf("await saveCase(pendingDraft)") < intake.indexOf("noteLocalCaseStored()"));
});

test("records local history only after a complete restore succeeds", () => {
  assert.ok(restore.indexOf("await restoreCaseBundle(bundle)") < restore.indexOf("noteLocalCaseStored()"));
});

test("installs empty-state history observation before library loading", () => {
  assert.ok(library.indexOf('src="case-history-ui.js"') < library.indexOf('src="case-library.js"'));
});
