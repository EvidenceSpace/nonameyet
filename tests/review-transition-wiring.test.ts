import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync("web/case-workspace.js", "utf8");
const transitionSource = readFileSync("web/review-transition.js", "utf8");
const reviewStyles = readFileSync("web/review.css", "utf8");

test("the case workspace loads and directly uses the atomic review boundary", () => {
  assert.match(
    workspaceSource,
    /^import \{ confirmSuggestionAsFact, syncRenderedFactSnapshots, syncRenderedSuggestionSnapshots \} from "\.\/review-transition\.js";/,
  );
  assert.match(workspaceSource, /syncRenderedFactSnapshots\(facts\);/);
  assert.match(workspaceSource, /syncRenderedSuggestionSnapshots\(active\);/);
  assert.match(workspaceSource, /await confirmSuggestionAsFact\(fact, suggestion\);/);
  assert.doesNotMatch(
    workspaceSource,
    /await saveFact\(fact\);\s*await deleteSuggestion\(suggestion\.id\);/,
  );
  assert.doesNotMatch(workspaceSource, /\bdeleteFact\b/);
});

test("fact removal uses the exact rendered fact and a local recovery state", () => {
  assert.match(transitionSource, /const fact = requireRenderedFact\(factId\);/);
  assert.match(transitionSource, /await removeFact\(fact\);/);
  assert.match(transitionSource, /db\.transaction\(\["facts", "cases"\], "readwrite"\)/);
  assert.match(transitionSource, /errorTarget: "fact"/);
  assert.match(transitionSource, /"fact-decision-status"/);
  assert.match(reviewStyles, /\.fact-record\[aria-busy="true"\]/);
});

test("every review decision passes the exact rendered suggestion snapshot", () => {
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
  assert.match(transitionSource, /await markSuggestionUncertain\(suggestion\);/);
  assert.match(transitionSource, /await dismissSuggestion\(suggestion\);/);
  assert.doesNotMatch(transitionSource, /deleteSuggestion\(suggestionId\)/);
  assert.doesNotMatch(transitionSource, /requireSuggestion\(/);
});

test("review decisions expose local failure and busy states", () => {
  assert.match(transitionSource, /"correction-review-status"/);
  assert.match(transitionSource, /setAttribute\("aria-busy", "true"\)/);
  assert.match(transitionSource, /activeReviewActions\.has\(suggestionId\)/);
  assert.match(transitionSource, /errorTarget: "correction", busyRoot: dialog/);
  assert.match(reviewStyles, /\.review-decision-status\{/);
  assert.match(reviewStyles, /\.suggestion-card\[aria-busy="true"\]/);
  assert.match(reviewStyles, /\.correction-dialog \.review-decision-status\{/);
});
