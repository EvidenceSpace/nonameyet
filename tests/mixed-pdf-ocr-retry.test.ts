import assert from "node:assert/strict";
import test from "node:test";
import {
  getMixedPdfOcrRetry,
  MIXED_PDF_OCR_RETRY_CANCELLED_MESSAGE,
  MIXED_PDF_OCR_RETRY_NO_IMPROVEMENT_MESSAGE,
  MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE,
  resolveMixedPdfOcrRetry,
} from "../web/mixed-pdf-ocr-retry.js";

const file = {
  id: "pdf-1",
  caseId: "case-1",
  sha256: "hash-1",
  type: "application/pdf",
};

function artifact(texts: string[]) {
  const pages = texts.map((text, index) => ({ pageNumber: index + 1, text }));
  return {
    adapterId: "pdfjs-text",
    adapterVersion: "1.0.0+pdfjs-4.10.38",
    pages,
    text: pages.map((page) => page.text.trim()).filter(Boolean).join("\n\n"),
    warnings: ["Local OCR did not complete for one or more pages."],
  };
}

function job(texts: string[], overrides: Record<string, unknown> = {}) {
  return {
    fileId: file.id,
    caseId: file.caseId,
    fileHash: file.sha256,
    status: "ready_for_ai",
    message: "Text ready with incomplete OCR coverage.",
    artifact: artifact(texts),
    failure: { code: "ocr_timeout", retryable: true },
    ...overrides,
  };
}

function improvedJob(texts: string[], overrides: Record<string, unknown> = {}) {
  return job(texts, {
    artifact: { ...artifact(texts), adapterId: "pdfjs-text+local-pdf-ocr" },
    ...overrides,
  });
}

test("offers retry only for a valid mixed artifact with a bounded transient failure", () => {
  const retry = getMixedPdfOcrRetry({ file, job: job(["Selectable text", ""]) });
  assert.equal(retry?.canRetry, true);
  assert.equal(retry?.retryLabel, "Retry missing OCR");
  assert.equal(retry?.missingPages, 1);
  assert.match(retry?.message || "", /Existing extracted text will be kept/);

  assert.equal(getMixedPdfOcrRetry({ file, job: job(["Selectable text", ""], {
    failure: { code: "empty_text", retryable: true },
  }) }), null);
  assert.equal(getMixedPdfOcrRetry({ file, job: job(["Selectable text", ""], {
    failure: { code: "unknown", retryable: true },
  }) }), null);
  assert.equal(getMixedPdfOcrRetry({ file, job: job(["Selectable text", "Recovered"]) }), null);
  assert.equal(getMixedPdfOcrRetry({ file, job: job(["", ""]) }), null);
  assert.equal(getMixedPdfOcrRetry({ file, job: job(["Selectable text", ""], { fileHash: "other" }) }), null);
});

test("replaces the old artifact only after at least one missing page is safely recovered", () => {
  const previousJob = job(["Selectable page", "", ""]);
  const result = improvedJob(["Selectable page", "Recovered OCR page", ""], {
    failure: { code: "ocr_timeout", retryable: true },
  });
  assert.deepEqual(resolveMixedPdfOcrRetry({ file, previousJob, result }), {
    replaceExisting: true,
    recoveredPages: 1,
    notice: "",
    reason: "improved",
  });
});

test("keeps the old artifact after cancellation or processing failure", () => {
  const previousJob = job(["Selectable page", ""]);
  const cancelled = resolveMixedPdfOcrRetry({
    file,
    previousJob,
    result: { ...job(["Selectable page", ""]), status: "cancelled", artifact: undefined },
  });
  assert.equal(cancelled.replaceExisting, false);
  assert.equal(cancelled.notice, MIXED_PDF_OCR_RETRY_CANCELLED_MESSAGE);

  for (const status of ["failed", "needs_ocr"]) {
    const failed = resolveMixedPdfOcrRetry({
      file,
      previousJob,
      result: { ...job(["Selectable page", ""]), status, artifact: undefined },
    });
    assert.equal(failed.replaceExisting, false);
    assert.equal(failed.notice, MIXED_PDF_OCR_RETRY_NO_IMPROVEMENT_MESSAGE);
  }
});

test("keeps the old artifact when a valid retry makes no improvement", () => {
  const previousJob = job(["Selectable page", ""]);
  const outcome = resolveMixedPdfOcrRetry({
    file,
    previousJob,
    result: improvedJob(["Selectable page", ""]),
  });
  assert.equal(outcome.replaceExisting, false);
  assert.equal(outcome.reason, "no_improvement");
  assert.equal(outcome.notice, MIXED_PDF_OCR_RETRY_NO_IMPROVEMENT_MESSAGE);
});

test("rejects page-set changes, readable-page changes, and mismatched results", () => {
  const previousJob = job(["Selectable page", ""]);
  const reorderedArtifact = {
    ...artifact(["Recovered", "Selectable page"]),
    pages: [
      { pageNumber: 2, text: "Recovered" },
      { pageNumber: 1, text: "Selectable page" },
    ],
  };
  reorderedArtifact.text = reorderedArtifact.pages.map((page) => page.text).join("\n\n");
  for (const result of [
    improvedJob(["Selectable page", "Recovered", "Unexpected page"]),
    improvedJob(["", "Recovered"]),
    improvedJob(["Changed selectable page", "Recovered"]),
    improvedJob(["Selectable page", "Recovered"], { artifact: { ...reorderedArtifact, adapterId: "pdfjs-text+local-pdf-ocr" } }),
    improvedJob(["Selectable page", "Recovered"], { fileHash: "other" }),
    improvedJob(["Selectable page", "Recovered"], { artifact: { ...artifact(["Selectable page", "Recovered"]), adapterId: "pdfjs-text+local-pdf-ocr", text: "tampered" } }),
    job(["Selectable page", "Recovered"]),
  ]) {
    const outcome = resolveMixedPdfOcrRetry({ file, previousJob, result });
    assert.equal(outcome.replaceExisting, false);
    assert.equal(outcome.notice, MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE);
  }
});

test("rejects a retry request when the previous artifact is not eligible", () => {
  const outcome = resolveMixedPdfOcrRetry({
    file,
    previousJob: job(["Selectable page", ""], { failure: { code: "empty_text", retryable: true } }),
    result: improvedJob(["Selectable page", "Recovered"]),
  });
  assert.equal(outcome.replaceExisting, false);
  assert.equal(outcome.reason, "ineligible_previous_job");
  assert.equal(outcome.notice, MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE);
});
