import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCaseReport,
  renderCaseReportHtml,
} from "../web/case-report-consistency.js";

function printableReport(amount = "$5,000") {
  return buildCaseReport({
    record: {
      title: "Website payment record",
      client: "Example client",
      amount,
      summary: "Final files were delivered.",
      goal: "request payment",
      status: "collecting",
      checklist: [],
    },
    files: [],
    facts: [],
    suggestions: [],
    events: [],
    generatedAt: "2026-07-30T12:00:00.000Z",
  });
}

test("adds an A4 print layout without executable report code", () => {
  const html = renderCaseReportHtml(printableReport());
  assert.match(html, /@page\{size:A4/);
  assert.match(html, /class="report-cover"/);
  assert.match(html, /class="notice report-scope"/);
  assert.match(html, /break-after:page/);
  assert.match(html, /thead\{display:table-header-group\}/);
  assert.equal(/<script/i.test(html), false);
  assert.match(html, /default-src 'none'/);
});

test("shows PDF instructions on screen but excludes them from print", () => {
  const html = renderCaseReportHtml(printableReport());
  assert.match(html, /Ready to save as PDF/);
  assert.match(html, /review every page before sharing/);
  assert.match(html, /\.print-guidance\{display:none!important\}/);
});

test("preserves the user-entered amount without assuming a currency", () => {
  const html = renderCaseReportHtml(printableReport("USD 5,000"));
  assert.match(html, /Amount entered: USD 5,000/);
  assert.equal(html.includes("₹USD 5,000"), false);
  assert.equal(html.includes("Amount remaining"), false);
});
