import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPdfOcrProgressView,
  createPdfOcrProgressTracker,
  formatPdfOcrProgress,
  normalizePdfOcrProgress,
} from "../web/pdf-ocr-progress.js";

test("formats the start of bounded local PDF OCR truthfully", () => {
  assert.equal(
    formatPdfOcrProgress({ completedPages: 0, totalPages: 3, pageNumber: 2, status: "starting" }),
    "Local OCR is checking 3 pages without selectable text.",
  );
  assert.equal(
    formatPdfOcrProgress({ completedPages: 0, totalPages: 1, pageNumber: 7, status: "starting" }),
    "Local OCR is checking 1 page without selectable text.",
  );
});

test("reports recognized and unresolved original PDF pages", () => {
  assert.equal(
    formatPdfOcrProgress({ completedPages: 1, totalPages: 2, pageNumber: 4, status: "recognized" }),
    "Local OCR checked 1 of 2 pages without selectable text · Text found on PDF page 4.",
  );
  assert.equal(
    formatPdfOcrProgress({ completedPages: 2, totalPages: 2, pageNumber: 9, status: "blank" }),
    "Local OCR checked 2 of 2 pages without selectable text · No readable text found on PDF page 9.",
  );
});

test("builds bounded native progress-meter values", () => {
  assert.deepEqual(
    buildPdfOcrProgressView({ completedPages: 0, totalPages: 3, pageNumber: 2, status: "starting" }),
    {
      max: 3,
      value: 0,
      label: "0 / 3 pages",
      ariaValueText: "0 of 3 PDF pages checked by local OCR.",
    },
  );
  assert.deepEqual(
    buildPdfOcrProgressView({ completedPages: 1, totalPages: 1, pageNumber: 7, status: "recognized" }),
    {
      max: 1,
      value: 1,
      label: "1 / 1 page",
      ariaValueText: "1 of 1 PDF page checked by local OCR.",
    },
  );
  assert.equal(buildPdfOcrProgressView({ completedPages: 1, totalPages: 51, pageNumber: 1, status: "recognized" }), null);
});

test("rejects malformed or unbounded progress metadata", () => {
  assert.equal(normalizePdfOcrProgress(null), null);
  assert.equal(normalizePdfOcrProgress({ completedPages: 0, totalPages: 0, pageNumber: 1, status: "starting" }), null);
  assert.equal(normalizePdfOcrProgress({ completedPages: 2, totalPages: 1, pageNumber: 1, status: "recognized" }), null);
  assert.equal(normalizePdfOcrProgress({ completedPages: 1, totalPages: 51, pageNumber: 1, status: "recognized" }), null);
  assert.equal(normalizePdfOcrProgress({ completedPages: 1, totalPages: 1, pageNumber: 501, status: "recognized" }), null);
  assert.equal(normalizePdfOcrProgress({ completedPages: 0, totalPages: 1, pageNumber: 1, status: "recognized" }), null);
  assert.equal(normalizePdfOcrProgress({ completedPages: 1, totalPages: 1, pageNumber: 1, status: "unexpected" }), null);
});

test("accepts only monotonic progress from the active run", () => {
  const tracker = createPdfOcrProgressTracker();
  const token = {};
  assert.equal(tracker.start("file-1", token), true);
  assert.equal(tracker.update("file-1", token, {
    completedPages: 1,
    totalPages: 2,
    pageNumber: 4,
    status: "recognized",
  }), "");
  assert.match(tracker.update("file-1", token, {
    completedPages: 0,
    totalPages: 2,
    pageNumber: 4,
    status: "starting",
  }), /checking 2 pages/);
  const exposed = tracker.progress("file-1");
  assert.deepEqual(exposed, {
    completedPages: 0,
    totalPages: 2,
    pageNumber: 4,
    status: "starting",
  });
  if (exposed) exposed.totalPages = 50;
  assert.equal(tracker.progress("file-1")?.totalPages, 2);
  assert.equal(tracker.update("file-1", token, {
    completedPages: 2,
    totalPages: 2,
    pageNumber: 8,
    status: "recognized",
  }), "");
  assert.match(tracker.update("file-1", token, {
    completedPages: 1,
    totalPages: 2,
    pageNumber: 4,
    status: "blank",
  }), /checked 1 of 2/);
  assert.equal(tracker.update("file-1", token, {
    completedPages: 1,
    totalPages: 3,
    pageNumber: 4,
    status: "recognized",
  }), "");
  assert.equal(tracker.update("file-1", token, {
    completedPages: 1,
    totalPages: 2,
    pageNumber: 4,
    status: "recognized",
  }), "");
  assert.match(tracker.update("file-1", token, {
    completedPages: 2,
    totalPages: 2,
    pageNumber: 8,
    status: "recognized",
  }), /checked 2 of 2/);
});

test("ignores stale callbacks and clears only the matching run", () => {
  const tracker = createPdfOcrProgressTracker();
  const first = {};
  const second = {};
  assert.equal(tracker.start("file-1", first), true);
  assert.match(tracker.update("file-1", first, {
    completedPages: 0,
    totalPages: 2,
    pageNumber: 3,
    status: "starting",
  }), /checking 2 pages/);
  assert.equal(tracker.start("file-1", second), true);
  assert.equal(tracker.update("file-1", first, {
    completedPages: 1,
    totalPages: 2,
    pageNumber: 3,
    status: "recognized",
  }), "");
  assert.equal(tracker.finish("file-1", first), false);
  assert.equal(tracker.message("file-1"), "");
  assert.match(tracker.update("file-1", second, {
    completedPages: 0,
    totalPages: 1,
    pageNumber: 8,
    status: "starting",
  }), /checking 1 page/);
  assert.match(tracker.update("file-1", second, {
    completedPages: 1,
    totalPages: 1,
    pageNumber: 8,
    status: "blank",
  }), /PDF page 8/);
  assert.equal(tracker.finish("file-1", second), true);
  assert.equal(tracker.message("file-1"), "");
  assert.equal(tracker.progress("file-1"), null);
});
