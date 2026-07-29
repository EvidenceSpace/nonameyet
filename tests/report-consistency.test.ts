import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConsistencyAppendix,
  renderConsistencyAppendixHtml,
} from "../web/report-consistency-model.js";

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const files = [
  { id: "file-a", name: "agreement.pdf", sha256: hashA },
  { id: "file-b", name: "invoice.pdf", sha256: hashB },
];

function fact(overrides: Record<string, unknown> = {}) {
  const id = String(overrides.id || "fact-a");
  const sourceFileId = String(overrides.sourceFileId || "file-a");
  const file = files.find((item) => item.id === sourceFileId) || files[0];
  return {
    id,
    type: "agreed_price",
    label: "Agreed price",
    value: id === "fact-a" ? "₹5,000" : "₹6,000",
    status: "confirmed",
    sourceFileId,
    sourceReference: {
      fileId: sourceFileId,
      sha256: file.sha256,
      locator: { kind: "pdf_page", page: id === "fact-a" ? 1 : 2, quote: `Quote ${id}` },
    },
    ...overrides,
  };
}

const conflictingFacts = [
  fact(),
  fact({ id: "fact-b", sourceFileId: "file-b" }),
];

test("unresolved verified differences are always disclosed with exact provenance", () => {
  const appendix = buildConsistencyAppendix({ record: {}, files, facts: conflictingFacts });
  assert.equal(appendix.totalCount, 1);
  assert.equal(appendix.unresolvedCount, 1);
  assert.equal(appendix.resolvedCount, 0);
  assert.equal(appendix.items[0].values.length, 2);
  assert.equal(appendix.items[0].values[0].source.sha256, hashA);
  assert.equal(appendix.items[0].values[1].source.locator, "PDF page 2");
  assert.match(renderConsistencyAppendixHtml(appendix), /review prompt, not a finding/);
});

test("selected source decisions preserve and display every participating value", () => {
  const unresolved = buildConsistencyAppendix({ record: {}, files, facts: conflictingFacts });
  const conflict = unresolved.items[0];
  const record = {
    conflictResolutions: {
      [conflict.id]: {
        conflictId: conflict.id,
        factIds: ["fact-a", "fact-b"],
        decision: "selected_fact",
        selectedFactId: "fact-b",
        note: "Client later approved this amount.",
        updatedAt: "2026-07-29T12:00:00Z",
      },
    },
  };
  const appendix = buildConsistencyAppendix({ record, files, facts: conflictingFacts });
  assert.equal(appendix.resolvedCount, 1);
  assert.equal(appendix.items[0].values.length, 2);
  assert.equal(appendix.items[0].values[1].selected, true);
  assert.equal(appendix.items[0].note, "");
  const html = renderConsistencyAppendixHtml(appendix);
  assert.match(html, /Selected for the organized record/);
  assert.match(html, /₹5,000/);
  assert.match(html, /₹6,000/);
  assert.equal(html.includes("Client later approved"), false);
});

test("comparison notes require a separate explicit opt-in", () => {
  const unresolved = buildConsistencyAppendix({ record: {}, files, facts: conflictingFacts });
  const conflict = unresolved.items[0];
  const record = {
    conflictResolutions: {
      [conflict.id]: {
        conflictId: conflict.id,
        factIds: ["fact-a", "fact-b"],
        decision: "contextual",
        selectedFactId: null,
        note: "PRIVATE COMPARISON NOTE",
        updatedAt: "2026-07-29T12:00:00Z",
      },
    },
  };
  const safe = buildConsistencyAppendix({ record, files, facts: conflictingFacts });
  assert.equal(renderConsistencyAppendixHtml(safe).includes("PRIVATE COMPARISON NOTE"), false);
  const included = buildConsistencyAppendix({
    record,
    files,
    facts: conflictingFacts,
    options: { includeConsistencyNotes: true },
  });
  assert.match(renderConsistencyAppendixHtml(included), /PRIVATE COMPARISON NOTE/);
});

test("stale resolutions fail closed after participating facts change", () => {
  const unresolved = buildConsistencyAppendix({ record: {}, files, facts: conflictingFacts });
  const conflict = unresolved.items[0];
  const record = {
    conflictResolutions: {
      [conflict.id]: {
        conflictId: conflict.id,
        factIds: ["fact-a", "removed-fact"],
        decision: "selected_fact",
        selectedFactId: "fact-a",
      },
    },
  };
  const appendix = buildConsistencyAppendix({ record, files, facts: conflictingFacts });
  assert.equal(appendix.unresolvedCount, 1);
  assert.match(appendix.items[0].decision, /No comparison decision/);
});

test("equivalent formatting and invalid provenance do not create report comparisons", () => {
  const equivalent = [
    fact({ value: "₹5,000" }),
    fact({ id: "fact-b", sourceFileId: "file-b", value: "₹5000" }),
  ];
  assert.equal(buildConsistencyAppendix({ record: {}, files, facts: equivalent }).totalCount, 0);
  const mismatched = [
    fact(),
    fact({
      id: "fact-b",
      sourceFileId: "file-b",
      sourceReference: { fileId: "file-b", sha256: hashA, locator: { kind: "whole_file" } },
    }),
  ];
  assert.equal(buildConsistencyAppendix({ record: {}, files, facts: mismatched }).totalCount, 0);
});

test("hostile values, filenames, excerpts, and notes are escaped", () => {
  const hostileFiles = [
    { ...files[0], name: '<img src="https://evil.test">' },
    files[1],
  ];
  const hostileFacts = [
    fact({ value: "<script>alert(1)</script>" }),
    fact({ id: "fact-b", sourceFileId: "file-b" }),
  ];
  const initial = buildConsistencyAppendix({ record: {}, files: hostileFiles, facts: hostileFacts });
  const conflict = initial.items[0];
  const record = {
    conflictResolutions: {
      [conflict.id]: {
        conflictId: conflict.id,
        factIds: ["fact-a", "fact-b"],
        decision: "contextual",
        note: "<svg onload=alert(2)>",
      },
    },
  };
  const appendix = buildConsistencyAppendix({
    record,
    files: hostileFiles,
    facts: hostileFacts,
    options: { includeConsistencyNotes: true },
  });
  const html = renderConsistencyAppendixHtml(appendix);
  assert.equal(/<script|<img|<svg/i.test(html), false);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;svg/);
});
