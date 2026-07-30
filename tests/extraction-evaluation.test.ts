import assert from "node:assert/strict";
import test from "node:test";
import { SYNTHETIC_EXTRACTION_CASES } from "../evals/synthetic-extraction-cases.js";
import {
  buildReferenceExtraction,
  evaluateExtractionFixture,
  summarizeExtractionEvaluations,
} from "../src/ai/evaluation.js";

test("reference outputs pass every synthetic extraction fixture", () => {
  const results = SYNTHETIC_EXTRACTION_CASES.map((fixture) =>
    evaluateExtractionFixture(fixture, buildReferenceExtraction(fixture)),
  );
  assert.equal(results.every((result) => result.passed), true);
  assert.equal(results.every((result) => result.acceptedStatuses.every((status) => status === "suggested")), true);
  const summary = summarizeExtractionEvaluations(results);
  assert.equal(summary.passedFixtures, SYNTHETIC_EXTRACTION_CASES.length);
  assert.equal(summary.precision, 1);
  assert.equal(summary.recall, 1);
});

test("a grounded but semantically false payment claim is a false positive", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES.find((item) => item.id === "negative-payment-evidence")!;
  const output = buildReferenceExtraction(fixture);
  output.candidates = [
    {
      kind: "fact",
      label: "Payment status",
      value: "Paid",
      confidence: 0.99,
      locator: { kind: "whole_file", quote: "Bank statement shows no matching payment" },
    },
  ];
  const result = evaluateExtractionFixture(fixture, output);
  assert.equal(result.contractAccepted, true);
  assert.equal(result.falsePositives, 1);
  assert.equal(result.falseNegatives, 1);
  assert.deepEqual(result.forbiddenValuesFound, ["Paid"]);
  assert.equal(result.passed, false);
});

test("an invented quote is rejected and cannot earn extraction credit", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES[0]!;
  const output = buildReferenceExtraction(fixture);
  output.candidates = [
    {
      kind: "fact",
      label: "Invoice total",
      value: "₹90,000",
      confidence: 0.99,
      locator: { kind: "whole_file", quote: "Total due: ₹90,000" },
    },
  ];
  const result = evaluateExtractionFixture(fixture, output);
  assert.deepEqual(result.rejectedReasons, ["ungrounded_quote"]);
  assert.equal(result.falsePositives, 0);
  assert.equal(result.falseNegatives, fixture.expected.length);
  assert.equal(result.passed, false);
});

test("contract-breaking output fails closed", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES[0]!;
  const result = evaluateExtractionFixture(fixture, { contractVersion: "unknown", candidates: [] });
  assert.equal(result.contractAccepted, false);
  assert.deepEqual(result.rejectedReasons, ["invalid_contract"]);
  assert.equal(result.passed, false);
});

test("hostile document instructions are detected without confirming the candidate", () => {
  const fixture = SYNTHETIC_EXTRACTION_CASES.find((item) => item.id === "hostile-invoice-content")!;
  const result = evaluateExtractionFixture(fixture, buildReferenceExtraction(fixture));
  assert.equal(result.passed, true);
  assert.deepEqual(result.missingInjectionRules, []);
  assert.deepEqual(result.acceptedStatuses, ["suggested"]);
});
