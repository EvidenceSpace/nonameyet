import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CASE_LENSES,
  GLOBAL_DESTINATIONS,
  PRODUCT_PAGE_IDS,
  buildShellHref,
  isProductPage,
  normalizeCaseId,
  normalizeContextId,
  normalizeEvidenceId,
  parseShellLocation,
  resolveShellRoute,
} from "../web/evidencespace-shell-model.js";
import { casesFixture, evidenceFixture, selectedEvidenceFixture } from "../web/evidencespace-pages/fixtures.js";

const expectedGlobal = ["Home", "Cases", "New case", "Lawyers", "Notifications", "Security and help", "Settings", "Account"];
const expectedLenses = ["Brief", "Space", "Evidence", "Research", "Work", "Room", "Reports"];

test("the connected shell preserves approved navigation order", () => {
  assert.deepEqual(GLOBAL_DESTINATIONS.map(({ label }) => label), expectedGlobal);
  assert.deepEqual(CASE_LENSES.map(({ label }) => label), expectedLenses);
});

test("route resolution distinguishes product pages from honest foundations", () => {
  assert.equal(resolveShellRoute(undefined).id, "home");
  assert.equal(resolveShellRoute("EVIDENCE").kind, "case");
  assert.equal(resolveShellRoute("research").globalDestination, "cases");
  assert.equal(resolveShellRoute("javascript:alert(1)").id, "not-found");
  assert.deepEqual(PRODUCT_PAGE_IDS, ["home", "cases", "brief", "evidence"]);
  assert.equal(isProductPage("brief"), true);
  assert.equal(isProductPage("space"), false);
});

test("case and object identifiers are bounded before display or linking", () => {
  assert.equal(normalizeCaseId("C-03"), "C-03");
  assert.equal(normalizeCaseId("matter-2048"), "matter-2048");
  assert.equal(normalizeCaseId("<img src=x onerror=alert(1)>"), "C-03");
  assert.equal(normalizeCaseId("a".repeat(41)), "C-03");
  assert.equal(normalizeEvidenceId("E-04"), "E-04");
  assert.equal(normalizeEvidenceId("javascript:alert(1)"), "E-04");
  assert.equal(normalizeContextId("E-04"), "E-04");
  assert.equal(normalizeContextId("<script>"), null);
});

test("deep links remain reloadable on static and packaged hosts", () => {
  assert.equal(buildShellHref("home", "C-03"), "?route=home");
  assert.equal(buildShellHref("brief", "C-03"), "?route=brief&case=C-03");
  assert.equal(
    buildShellHref("evidence", "C-03", { evidenceId: "E-04", from: "brief" }),
    "?route=evidence&case=C-03&evidence=E-04&from=brief",
  );
  assert.equal(
    buildShellHref("brief", "C-03", { contextId: "E-04" }),
    "?route=brief&case=C-03&context=E-04",
  );
  assert.equal(buildShellHref("unknown", "C-03"), "?route=home");
});

test("location parsing retains exact-object and recovery state", () => {
  const location = parseShellLocation("?route=evidence&case=C-03&evidence=E-04&context=E-04&from=brief&view=error");
  assert.equal(location.route.id, "evidence");
  assert.equal(location.caseId, "C-03");
  assert.equal(location.evidenceId, "E-04");
  assert.equal(location.contextId, "E-04");
  assert.equal(location.from, "brief");
  assert.equal(location.viewState, "error");
  assert.equal(parseShellLocation("?view=made-up").viewState, "ready");
});

test("the synthetic library tells the truth about visible records", () => {
  assert.equal(casesFixture.length, 4);
  assert.equal(casesFixture.filter(({ id }) => id === "C-03").length, 1);
  assert.equal(evidenceFixture.length, 6);
  assert.equal(evidenceFixture.filter(({ needsReview }) => needsReview).length, 2);
  assert.equal(selectedEvidenceFixture.id, "E-04");
  assert.equal(selectedEvidenceFixture.statements.some(({ tone }) => tone === "contrary"), true);
});

test("the renderer owns history, focus, loading, and cleanup contracts", async () => {
  const [html, script, css] = await Promise.all([
    readFile(new URL("../web/evidencespace-shell.html", import.meta.url), "utf8"),
    readFile(new URL("../web/evidencespace-shell.js", import.meta.url), "utf8"),
    readFile(new URL("../web/evidencespace-shell.css", import.meta.url), "utf8"),
  ]);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /Skip to main content/);
  assert.match(script, /history\[method\]/);
  assert.match(script, /popstate/);
  assert.match(script, /cleanupPage\?\.\(\)/);
  assert.match(script, /import\("\.\/evidencespace-pages\/home\.js"\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
});
