import assert from "node:assert/strict";
import test from "node:test";
import { buildChecklistAppendix, renderChecklistAppendixHtml } from "../web/report-checklist-model.js";

const states = {
  agreement: "found", price: "needs_review", invoice: "found",
  delivery: "missing", approval: "not_applicable", reminders: "missing",
};

test("report checklist preserves every explicit user status", () => {
  const review = buildChecklistAppendix({ checklistStates: states });
  assert.deepEqual(
    { found: review.found, needsReview: review.needsReview, missing: review.missing, notApplicable: review.notApplicable },
    { found: 2, needsReview: 1, missing: 2, notApplicable: 1 },
  );
  assert.equal(review.items.length, 6);
  assert.equal(review.items.find((item) => item.key === "approval").status, "not_applicable");
});

test("legacy binary checklists render found and missing without data loss", () => {
  const review = buildChecklistAppendix({ checklist: ["invoice", "delivery"] });
  assert.equal(review.found, 2);
  assert.equal(review.missing, 4);
  assert.equal(review.items.find((item) => item.key === "invoice").status, "found");
});

test("checklist report is omitted only through explicit export choice", () => {
  assert.equal(buildChecklistAppendix({ checklistStates: states }, false), null);
  assert.equal(renderChecklistAppendixHtml(null), "");
});

test("rendered checklist discloses boundaries and all four state labels", () => {
  const html = renderChecklistAppendixHtml(buildChecklistAppendix({ checklistStates: states }));
  for (const label of ["Found", "Missing", "Needs review", "Not applicable"]) assert.match(html, new RegExp(label));
  assert.match(html, /do not establish that a record is authentic, sufficient, or legally required/);
  assert.equal((html.match(/<tr>/g) || []).length, 7);
});

test("invalid stored states fail to the safe legacy state", () => {
  const review = buildChecklistAppendix({ checklistStates: { invoice: '<img src="https://evil.test">' } });
  assert.equal(review.items.find((item) => item.key === "invoice").status, "missing");
  assert.equal(renderChecklistAppendixHtml(review).includes("evil.test"), false);
});
