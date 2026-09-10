import assert from "node:assert/strict";
import test from "node:test";

import {
  adaptEvidenceSourceSnapshot,
  loadEvidenceRecord,
} from "../web/evidencespace-pages/evidence-record-adapter.js";
import { renderPage as renderEvidencePage } from "../web/evidencespace-pages/evidence.js";
import { selectedEvidenceSourceFixture } from "../web/evidencespace-pages/fixtures.js";

const hash = "4".repeat(64);
const reference = { fileId: "file_e04", sha256: hash, locator: { kind: "whole_file" } };

function snapshot() {
  return {
    caseId: "C-03",
    evidenceId: "E-04",
    file: {
      id: "file_e04",
      caseId: "C-03",
      name: "2-August-email.eml",
      type: "message/rfc822",
      size: 24 * 1024,
      sha256: hash,
      createdAt: "2026-08-02T09:22:00.000Z",
      original: { name: "2-August-email.eml", type: "message/rfc822", size: 24 * 1024, lastModified: 1 },
    },
    processing: { fileId: "file_e04", caseId: "C-03", fileHash: hash, status: "ready_for_ai" },
    facts: [{
      id: "A1", caseId: "C-03", sourceFileId: "file_e04", label: "Receipt",
      value: "We received the final package on Friday.", status: "confirmed",
      relation: "supports", sourceReference: structuredClone(reference),
    }],
    suggestions: [{
      id: "A2", caseId: "C-03", fileId: "file_e04", label: "Concern",
      value: "I do have concerns about some of the mobile layouts.", status: "uncertain",
      relation: "contrary", aiSuggested: true, decidedByUser: false,
      sourceReference: structuredClone(reference),
    }],
    record: {
      title: "Quality concern email",
      filename: "2-August-email.eml",
      kind: "Original email message (.eml)",
      source: "Client email thread",
      date: "2 August 2026 · 10:14",
      imported: "2 August 2026 · 10:22",
      addedBy: "Riley Morgan",
      integrity: "Checksum recorded",
      visibility: "Case members",
      backlinks: 3,
      assessment: "The first written objection follows the recorded delivery and acknowledgement.",
      preview: {
        from: "Mia Collins <mia@example.test>",
        to: "Alex Morgan <alex@example.test>",
        date: "2 August 2026 · 10:14",
        subject: "Re: final delivery and invoice",
        body: ["Hi Alex,", "We received the final package on Friday and have started preparing the launch materials."],
        receipt: "We received the final package on Friday",
        concern: "I do have concerns about some of the mobile layouts",
        closing: "Thanks, Mia",
        footerLeft: "Message ID preserved",
        footerRight: "Page 1 of 1",
      },
    },
  };
}

test("uses an explicit immutable synthetic fallback only when no provider exists", async () => {
  const result = await loadEvidenceRecord({ caseId: "C-03", evidenceId: "E-04", fallbackRecord: snapshot() });
  assert.equal(result.status, "ready");
  assert.equal(result.origin, "synthetic");
  assert.equal(result.record.filename, "2-August-email.eml");
  assert.equal(result.record.sizeLabel, "24 KB");
  assert.equal(Object.isFrozen(result.record), true);
  assert.equal(Object.isFrozen(result.record.statements), true);
});

test("adapts a matching provider snapshot without exposing original bytes", async () => {
  const result = await loadEvidenceRecord({
    caseId: "C-03",
    evidenceId: "E-04",
    provider: { readEvidenceRecord: async () => ({ status: "ready", snapshot: snapshot() }) },
    fallbackRecord: snapshot(),
  });
  assert.equal(result.status, "ready");
  assert.equal(result.origin, "provider");
  assert.equal(result.record.sha256, hash);
  assert.equal("original" in result.record, false);
});

test("fails closed for denied, missing, deleted, stale, changed, and error provider states", async () => {
  for (const status of ["denied", "missing", "deleted", "stale", "changed", "error"]) {
    const result = await loadEvidenceRecord({
      caseId: "C-03",
      evidenceId: "E-04",
      provider: async () => ({ status }),
      fallbackRecord: snapshot(),
    });
    assert.equal(result.status, status);
    assert.equal("record" in result, false);
  }
});

test("treats processing identity drift as stale and source-reference drift as changed", () => {
  const stale = snapshot();
  stale.processing.fileHash = "5".repeat(64);
  assert.equal(adaptEvidenceSourceSnapshot(stale, { caseId: "C-03", evidenceId: "E-04" }).status, "stale");

  const changed = snapshot();
  changed.suggestions[0].sourceReference.sha256 = "6".repeat(64);
  assert.equal(adaptEvidenceSourceSnapshot(changed, { caseId: "C-03", evidenceId: "E-04" }).status, "changed");

  const replacedOriginal = snapshot();
  replacedOriginal.file.original.size += 1;
  assert.equal(adaptEvidenceSourceSnapshot(replacedOriginal, { caseId: "C-03", evidenceId: "E-04" }).status, "changed");
});

test("preserves contrary material instead of flattening it into support", () => {
  const result = adaptEvidenceSourceSnapshot(snapshot(), { caseId: "C-03", evidenceId: "E-04" });
  assert.equal(result.status, "ready");
  assert.deepEqual(
    result.record.statements.map(({ id, tone, state }) => ({ id, tone, state })),
    [
      { id: "A1", tone: "confirmed", state: "Confirmed" },
      { id: "A2", tone: "contrary", state: "Contrary" },
    ],
  );
});

test("does not cache a failed read, allowing explicit recovery", async () => {
  let attempt = 0;
  const provider = async () => {
    attempt += 1;
    if (attempt === 1) throw new Error("storage unavailable");
    return { status: "ready", snapshot: snapshot() };
  };
  const first = await loadEvidenceRecord({ caseId: "C-03", evidenceId: "E-04", provider, fallbackRecord: snapshot() });
  const second = await loadEvidenceRecord({ caseId: "C-03", evidenceId: "E-04", provider, fallbackRecord: snapshot() });
  assert.equal(first.status, "error");
  assert.equal(second.status, "ready");
  assert.equal(attempt, 2);
});

test("does not reuse a previous record after provider rollback or deletion", async () => {
  let deleted = false;
  const provider = async () => deleted
    ? { status: "deleted" }
    : { status: "ready", snapshot: snapshot() };
  const first = await loadEvidenceRecord({ caseId: "C-03", evidenceId: "E-04", provider, fallbackRecord: snapshot() });
  deleted = true;
  const second = await loadEvidenceRecord({ caseId: "C-03", evidenceId: "E-04", provider, fallbackRecord: snapshot() });
  assert.equal(first.status, "ready");
  assert.equal(second.status, "deleted");
  assert.equal("record" in second, false);
});

test("never substitutes demo data for malformed provider output", async () => {
  const result = await loadEvidenceRecord({
    caseId: "C-03",
    evidenceId: "E-04",
    provider: async () => ({ status: "ready", snapshot: { caseId: "C-03", evidenceId: "E-04" } }),
    fallbackRecord: snapshot(),
  });
  assert.equal(result.status, "changed");
  assert.equal("record" in result, false);
});

test("the C-03/E-04 fallback stays source-linked and visibly synthetic", () => {
  const result = adaptEvidenceSourceSnapshot(selectedEvidenceSourceFixture, {
    caseId: "C-03",
    evidenceId: "E-04",
    origin: "synthetic",
  });
  assert.equal(result.status, "ready");
  assert.deepEqual(
    result.record.statements.map(({ id, tone, state }) => ({ id, tone, state })),
    [
      { id: "A1", tone: "confirmed", state: "Ready" },
      { id: "A2", tone: "contrary", state: "Contrary" },
    ],
  );
  const markup = renderEvidencePage({
    caseId: "C-03",
    evidenceId: "E-04",
    from: "brief",
    viewState: "ready",
    evidenceResult: result,
  });
  assert.match(markup, /Synthetic preview/);
  assert.match(markup, /Confirm A1/);
  assert.match(markup, /2-August-email\.eml/);
});

test("provider records render read-only while denied results reveal no source detail", () => {
  const providerResult = adaptEvidenceSourceSnapshot(selectedEvidenceSourceFixture, {
    caseId: "C-03",
    evidenceId: "E-04",
    origin: "provider",
  });
  const providerMarkup = renderEvidencePage({
    caseId: "C-03",
    evidenceId: "E-04",
    from: "brief",
    viewState: "ready",
    evidenceResult: providerResult,
  });
  assert.match(providerMarkup, /Read-only source/);
  assert.doesNotMatch(providerMarkup, /Confirm A1/);

  const deniedMarkup = renderEvidencePage({
    caseId: "C-03",
    evidenceId: "E-04",
    from: "brief",
    viewState: "ready",
    evidenceResult: { status: "denied", origin: "provider" },
  });
  assert.match(deniedMarkup, /Nothing private was shown/);
  assert.doesNotMatch(deniedMarkup, /2-August-email\.eml/);
  assert.doesNotMatch(deniedMarkup, /Quality concern email/);
});
