import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync("web/case-workspace.js", "utf8");
const transitionSource = readFileSync("web/review-transition.js", "utf8");
const reviewStyles = readFileSync("web/review.css", "utf8");

test("the case workspace loads and directly uses the atomic review boundary", () => {
  assert.match(
    workspaceSource,
    /^import \{ confirmSuggestionAsFact, syncRenderedSuggestionSnapshots \} from "\.\/review-transition\.js";/,
  );
  assert.match(workspaceSource, /syncRenderedSuggestionSnapshots\(active\);/);
  assert.match(workspaceSource, /await confirmSuggestionAsFact\(fact, suggestion\);/);
  assert.doesNotMatch(
    workspaceSource,
    /await saveFact\(fact\);\s*await deleteSuggestion\(suggestion\.id\);/,
  );
});

test("confirmation and correction pass the exact suggestion snapshot", () => {
  assert.match(
    transitionSource,
    /confirmSuggestionAsFact\(\s*buildFact\(caseId, suggestion, suggestion\.value, "confirmed"\),\s*suggestion,\s*\)/,
  );
  assert.match(
    transitionSource,
    /confirmSuggestionAsFact\(\s*buildFact\(caseId, suggestion, value, "corrected"\),\s*suggestion,\s*\)/,
  );
  assert.doesNotMatch(transitionSource, /confirmSuggestionAsFact\([^;]+suggestion\.id\)/s);
  assert.match(transitionSource, /const suggestion = requireRenderedSuggestion\(suggestionId\);/);
});

test("review decisions expose local failure and busy states", () => {
  assert.match(transitionSource, /"correction-review-status"/);
  assert.match(transitionSource, /setAttribute\("aria-busy", "true"\)/);
  assert.match(transitionSource, /activeReviewActions\.has\(suggestionId\)/);
  assert.match(transitionSource, /errorTarget: "correction", busyRoot: dialog/);
  assert.match(reviewStyles, /\.review-decision-status\{/);
  assert.match(reviewStyles, /\.suggestion-card\[aria-busy="true"\]\{/);
  assert.match(reviewStyles, /\.correction-dialog \.review-decision-status\{/);
});
