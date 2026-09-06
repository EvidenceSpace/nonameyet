import assert from "node:assert/strict";
import test from "node:test";

import {
  CASE_LENSES,
  GLOBAL_DESTINATIONS,
  buildShellHref,
  normalizeCaseId,
  resolveShellRoute,
} from "../web/evidencespace-shell-model.js";

test("the shell preserves the approved global and case navigation order", () => {
  assert.deepEqual(
    GLOBAL_DESTINATIONS.map(({ label }) => label),
    ["Home", "Cases", "New case", "Lawyers", "Notifications", "Security/help", "Settings", "Account"],
  );
  assert.deepEqual(
    CASE_LENSES.map(({ label }) => label),
    ["Brief", "Space", "Evidence", "Research", "Work", "Room", "Reports"],
  );
});

test("route resolution separates known case routes from rejected input", () => {
  assert.equal(resolveShellRoute(undefined).id, "home");
  assert.equal(resolveShellRoute("EVIDENCE").kind, "case");
  assert.equal(resolveShellRoute("research").globalDestination, "cases");
  assert.equal(resolveShellRoute("javascript:alert(1)").id, "not-found");
});

test("case identifiers are bounded before display or link construction", () => {
  assert.equal(normalizeCaseId("C-03"), "C-03");
  assert.equal(normalizeCaseId("matter-2048"), "matter-2048");
  assert.equal(normalizeCaseId("<img src=x onerror=alert(1)>"), "C-03");
  assert.equal(normalizeCaseId("a".repeat(41)), "C-03");
  assert.equal(buildShellHref("evidence", "C-03"), "/evidencespace-shell.html?route=evidence&case=C-03");
  assert.equal(buildShellHref("unknown", "C-03"), "/evidencespace-shell.html?route=home");
});
