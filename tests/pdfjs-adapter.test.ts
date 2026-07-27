import assert from "node:assert/strict";
import test from "node:test";
import { createProcessingJob, prepareAiHandoff, runProcessingJob } from "../src/processing/pipeline.js";
import {
  createPdfJsTextAdapter,
  descriptorFromBrowserFile,
  type BinaryFileDescriptor,
  type PdfJsDocument,
  type PdfJsLoadingTask,
  type PdfJsRuntime,
} from "../src/processing/adapters/pdfjs.js";

function binaryFile(overrides: Partial<BinaryFileDescriptor> = {}): BinaryFileDescriptor {
  const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
  return {
    id: "file_pdf",
    caseId: "case_1",
    name: "agreement.pdf",
    type: "application/pdf",
    size: bytes.byteLength,
    sha256: "a".repeat(64),
    readBytes: async () => bytes,
    ...overrides,
  };
}

function runtimeWith(document: PdfJsDocument, capture?: (options: Record<string, unknown>) => void): PdfJsRuntime {
  return {
    version: "5.4-test",
    getDocument(options) {
      capture?.(options);
      return { promise: Promise.resolve(document) };
    },
  };
}

function documentWithPages(pageItems: Array<Array<{ str?: string; hasEOL?: boolean }>>): PdfJsDocument {
  return {
    numPages: pageItems.length,
    async getPage(pageNumber) {
      const items = pageItems[pageNumber - 1];
      if (!items) throw new Error("missing page");
      return { getTextContent: async () => ({ items }) };
    },
  };
}

test("extracts ordered PDF.js text without sending bytes anywhere", async () => {
  let options: Record<string, unknown> | undefined;
  const runtime = runtimeWith(documentWithPages([
    [{ str: "Project price:" }, { str: "₹20,000", hasEOL: true }, { str: "Approved" }],
    [{ str: "Payment due" }, { str: "in 7 days." }],
  ]), (value) => { options = value; });
  const file = binaryFile();
  const adapter = createPdfJsTextAdapter(runtime, { minTextCharacters: 5 });
  const result = await adapter.extract(file, {});

  assert.equal(result.kind, "text");
  if (result.kind !== "text") return;
  assert.equal(result.pages[0]?.text, "Project price: ₹20,000\nApproved");
  assert.equal(result.pages[1]?.text, "Payment due in 7 days.");
  assert.equal(adapter.version, "1.0.0+pdfjs-5.4-test");
  assert.equal(options?.isEvalSupported, false);
  assert.equal(options?.useWorkerFetch, false);
  assert.equal(options?.stopAtErrors, true);
  assert.ok(options?.data instanceof Uint8Array);
  assert.equal(Object.keys(options ?? {}).some((key) => /url|http/i.test(key)), false);
});

test("routes image-only and nearly empty PDFs to OCR", async () => {
  const adapter = createPdfJsTextAdapter(runtimeWith(documentWithPages([[], [{ str: "x" }]])), { minTextCharacters: 5 });
  const result = await adapter.extract(binaryFile(), {});
  assert.equal(result.kind, "needs_ocr");
  if (result.kind !== "needs_ocr") return;
  assert.match(result.reason, /too little selectable text/i);
  assert.deepEqual(result.warnings, ["Page 1 has no readable text layer."]);
});

test("rejects oversized, mismatched, and excessive-page PDFs", async () => {
  const normalRuntime = runtimeWith(documentWithPages([[{ str: "Readable text layer" }]]));
  const oversized = createPdfJsTextAdapter(normalRuntime, { maxBytes: 4 });
  await assert.rejects(() => oversized.extract(binaryFile(), {}), (error: unknown) => {
    return error instanceof Error && "code" in error && error.code === "file_too_large";
  });

  const mismatch = createPdfJsTextAdapter(normalRuntime);
  await assert.rejects(() => mismatch.extract(binaryFile({ size: 99 }), {}), (error: unknown) => {
    return error instanceof Error && "code" in error && error.code === "corrupt_file";
  });

  const tooMany = createPdfJsTextAdapter(runtimeWith({ numPages: 501, getPage: async () => { throw new Error("not reached"); } }), { maxPages: 500 });
  await assert.rejects(() => tooMany.extract(binaryFile(), {}), (error: unknown) => {
    return error instanceof Error && "code" in error && error.code === "too_many_pages";
  });
});

test("classifies encrypted and malformed PDFs as permanent failures", async () => {
  const failing = (name: string, message: string): PdfJsRuntime => ({
    getDocument() {
      const error = new Error(message);
      error.name = name;
      return { promise: Promise.reject(error) };
    },
  });

  await assert.rejects(() => createPdfJsTextAdapter(failing("PasswordException", "Password required")).extract(binaryFile(), {}), (error: unknown) => {
    return error instanceof Error && "code" in error && error.code === "password_protected" && "retryable" in error && error.retryable === false;
  });
  await assert.rejects(() => createPdfJsTextAdapter(failing("InvalidPDFException", "Bad xref")).extract(binaryFile(), {}), (error: unknown) => {
    return error instanceof Error && "code" in error && error.code === "corrupt_file";
  });
});

test("cancellation destroys the PDF.js loading task", async () => {
  const controller = new AbortController();
  let rejectLoading: ((reason: unknown) => void) | undefined;
  let markStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => { markStarted = resolve; });
  let destroyed = false;
  const loadingTask: PdfJsLoadingTask = {
    promise: new Promise((_resolve, reject) => { rejectLoading = reject; }),
    destroy() {
      destroyed = true;
      const error = new DOMException("cancelled", "AbortError");
      rejectLoading?.(error);
    },
  };
  const runtime: PdfJsRuntime = { getDocument: () => { markStarted?.(); return loadingTask; } };
  const extraction = createPdfJsTextAdapter(runtime).extract(binaryFile(), { signal: controller.signal });
  await started;
  controller.abort();
  await assert.rejects(extraction, (error: unknown) => error instanceof Error && error.name === "AbortError");
  assert.equal(destroyed, true);
});

test("integrates with the processing pipeline and provenance-safe AI handoff", async () => {
  const file = binaryFile();
  const adapter = createPdfJsTextAdapter(runtimeWith(documentWithPages([[{ str: "The invoice total is ₹5,000 and remains unpaid." }]])), { minTextCharacters: 5 });
  const job = createProcessingJob({ id: "job_pdf", file, now: new Date("2026-07-27T12:00:00Z") });
  const result = await runProcessingJob(job, file, { adapters: [adapter], now: () => new Date("2026-07-27T12:00:01Z") });
  assert.equal(result.status, "ready_for_ai");
  assert.equal(result.artifact?.adapterId, "pdfjs-text");
  const handoff = prepareAiHandoff(result, file.name);
  assert.equal(handoff.sourceText, "The invoice total is ₹5,000 and remains unpaid.");
  assert.equal(handoff.fileHash, file.sha256);
});

test("creates a byte-backed descriptor from a browser Blob", async () => {
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "application/pdf" });
  const descriptor = descriptorFromBrowserFile({ id: "f", caseId: "c", sha256: "d".repeat(64), file: blob, name: "invoice.pdf" });
  assert.equal(descriptor.size, 3);
  assert.deepEqual([...await descriptor.readBytes()], [1, 2, 3]);
});
