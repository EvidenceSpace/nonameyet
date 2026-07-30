import assert from "node:assert/strict";
import test from "node:test";
import { EXTENDED_SYNTHETIC_EXTRACTION_CASES } from "../evals/extended-synthetic-extraction-cases.js";
import { SYNTHETIC_EXTRACTION_CASES } from "../evals/synthetic-extraction-cases.js";
import { buildReferenceExtraction, evaluateExtractionFixture, summarizeExtractionEvaluations } from "../src/ai/evaluation.js";
import { MAX_SUGGESTIONS_PER_FILE } from "../src/ai/review.js";

test("extended reference outputs remain internally consistent", () => {
  const results = EXTENDED_SYNTHETIC_EXTRACTION_CASES.map((fixture) =>
    evaluateExtractionFixture(fixture, buildReferenceExtraction(fixture)),
  );
  const summary = summarizeExtractionEvaluations(results);
  assert.equal(summary.totalFixtures, EXTENDED_SYNTHETIC_EXTRACTION_CASES.length);
  assert.equal(summary.passedFixtures, EXTENDED_SYNTHETIC_EXTRACTION_CASES.length);
  assert.equal(summary.precision, 1);
  assert.equal(summary.recall, 1);
  assert.equal(results.every((result) => result.acceptedStatuses.every((status) => status === "suggested")), true);
});

test("malformed provider JSON fails closed at the contract boundary", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES[0]!;
  const result = evaluateExtractionFixture(fixture, '{"contractVersion":"file-extraction.v1"');
  assert.equal(result.contractAccepted, false);
  assert.deepEqual(result.rejectedReasons, ["invalid_contract"]);
  assert.equal(result.truePositives, 0);
});

test("duplicate candidates earn credit once and expose the duplicate rejection", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES[0]!;
  const output = buildReferenceExtraction(fixture);
  output.candidates = [fixture.expected[0]!, fixture.expected[0]!];
  const result = evaluateExtractionFixture(fixture, output);
  assert.equal(result.truePositives, 1);
  assert.equal(result.falseNegatives, fixture.expected.length - 1);
  assert.deepEqual(result.rejectedReasons, ["duplicate"]);
});

test("low-confidence candidates cannot earn extraction credit", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES[0]!;
  const output = buildReferenceExtraction(fixture);
  output.candidates = [{ ...fixture.expected[0]!, confidence: 0.14 }];
  const result = evaluateExtractionFixture(fixture, output);
  assert.equal(result.truePositives, 0);
  assert.equal(result.falseNegatives, fixture.expected.length);
  assert.deepEqual(result.rejectedReasons, ["low_confidence"]);
});

test("the review boundary caps accepted candidates deterministically", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES[0]!;
  const output = buildReferenceExtraction(fixture);
  output.candidates = Array.from({ length: MAX_SUGGESTIONS_PER_FILE + 1 }, (_, index) => ({
    kind: "fact" as const,
    label: `Synthetic label ${index}`,
    value: `Synthetic value ${index}`,
    confidence: 1,
    locator: { kind: "whole_file" as const, quote: "Invoice number CF-104" },
  }));
  const result = evaluateExtractionFixture(fixture, output);
  assert.equal(result.acceptedStatuses.length, MAX_SUGGESTIONS_PER_FILE);
  assert.equal(result.acceptedStatuses.every((status) => status === "suggested"), true);
  assert.deepEqual(result.rejectedReasons, ["limit_reached"]);
});
