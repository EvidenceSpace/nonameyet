import { loadLocalPdfEngine } from "./pdf-engine.js";
import { SCANNED_PDF_BASE_MESSAGE } from "./scanned-pdf-recovery.js";
import { classifyPdfFailure } from "./pdf-failure-recovery.js";

export const PDF_CANCELLED_MESSAGE = "Local PDF text extraction was cancelled.";
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_TEXT_CHARACTERS = 2_000_000;
export const PDF_PROCESSING_TIMEOUT_MS = 60_000;

function processingError(code, message) {
  return Object.assign(new Error(message), { code });
}

function cancellationError() {
  return new DOMException("cancelled", "AbortError");
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw cancellationError();
}

function abortable(operation, signal, onAbort) {
  if (!signal) return Promise.resolve(operation);
  if (signal.aborted) {
    onAbort?.();
    return Promise.reject(cancellationError());
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", handleAbort);
      handler(value);
    };
    const handleAbort = () => {
      try { onAbort?.(); } catch {}
      finish(reject, cancellationError());
    };
    signal.addEventListener("abort", handleAbort, { once: true });
    Promise.resolve(operation).then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}

function createDeadlineSignal(signal, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  const handleExternalAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", handleExternalAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", handleExternalAbort);
    },
  };
}

export async function processPdf(file, {
  signal,
  runtime,
  maxBytes = MAX_PDF_BYTES,
  maxTextCharacters = MAX_PDF_TEXT_CHARACTERS,
  timeoutMs = PDF_PROCESSING_TIMEOUT_MS,
} = {}) {
  const base = { fileId: file.id, caseId: file.caseId, fileHash: file.sha256, updatedAt: new Date().toISOString() };
  const deadline = createDeadlineSignal(signal, timeoutMs);
  const workSignal = deadline.signal;
  let task;
  let doc;
  let taskDestroyed = false;
  const destroyTask = () => {
    if (taskDestroyed || !task?.destroy) return;
    taskDestroyed = true;
    try { Promise.resolve(task.destroy()).catch(() => {}); } catch {}
  };
  try {
    throwIfAborted(workSignal);
    const declaredBytes = Number(file.original?.size ?? file.size ?? 0);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw processingError("file_too_large", "PDF exceeds local byte limit.");
    }
    const originalBytes = await abortable(file.original.arrayBuffer(), workSignal);
    throwIfAborted(workSignal);
    if (originalBytes.byteLength > maxBytes) throw processingError("file_too_large", "PDF exceeds local byte limit.");
    const pdfjs = runtime || await abortable(loadLocalPdfEngine(), workSignal);
    throwIfAborted(workSignal);
    task = pdfjs.getDocument({ data: new Uint8Array(originalBytes), isEvalSupported: false, useWorkerFetch: false, useSystemFonts: true, stopAtErrors: true });
    doc = await abortable(task.promise, workSignal, destroyTask);
    throwIfAborted(workSignal);
    if (doc.numPages > 500) throw processingError("too_many_pages", "This PDF has more than 500 pages.");
    const pages = [];
    let readableCharacters = 0;
    let extractedCharacters = 0;
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      throwIfAborted(workSignal);
      const page = await abortable(doc.getPage(pageNumber), workSignal, destroyTask);
      try {
        const content = await abortable(page.getTextContent({ disableNormalization: false, includeMarkedContent: false }), workSignal, destroyTask);
        throwIfAborted(workSignal);
        let text = "";
        for (const item of content.items) {
          if (typeof item.str !== "string") continue;
          const separator = text && !text.endsWith("\n") && !/^\s/.test(item.str) && !/\s$/.test(text) ? " " : "";
          const ending = item.hasEOL ? "\n" : "";
          extractedCharacters += separator.length + item.str.length + ending.length;
          if (extractedCharacters > maxTextCharacters) {
            throw processingError("text_limit_exceeded", "PDF selectable text exceeds local character limit.");
          }
          text += separator + item.str + ending;
        }
        readableCharacters += text.replace(/\s/g, "").length;
        pages.push({ pageNumber, text });
      } finally {
        page.cleanup?.();
      }
    }
    throwIfAborted(workSignal);
    if (readableCharacters < 20) return { ...base, status: "needs_ocr", message: SCANNED_PDF_BASE_MESSAGE, pages: [] };
    return {
      ...base,
      status: "ready_for_ai",
      message: `Text ready from ${pages.length} page${pages.length === 1 ? "" : "s"}.`,
      artifact: {
        adapterId: "pdfjs-text",
        adapterVersion: `1.0.0+pdfjs-${pdfjs.version}`,
        pages,
        text: pages.map((page) => page.text.trim()).filter(Boolean).join("\n\n"),
      },
    };
  } catch (error) {
    if (signal?.aborted) {
      return { ...base, status: "cancelled", message: PDF_CANCELLED_MESSAGE, failure: { code: "cancelled", retryable: false } };
    }
    const failure = classifyPdfFailure(deadline.timedOut()
      ? processingError("processing_timeout", "PDF processing timed out.")
      : error);
    return { ...base, status: "failed", message: failure.message, failure: { code: failure.code, retryable: failure.retryable } };
  } finally {
    deadline.cleanup();
    try { await doc?.destroy?.(); } catch {}
  }
}
