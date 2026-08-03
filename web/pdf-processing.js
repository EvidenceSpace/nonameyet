import { loadLocalPdfEngine } from "./pdf-engine.js";
import { SCANNED_PDF_BASE_MESSAGE } from "./scanned-pdf-recovery.js";
import { classifyPdfFailure } from "./pdf-failure-recovery.js";

export const PDF_CANCELLED_MESSAGE = "Local PDF text extraction was cancelled.";

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

export async function processPdf(file, { signal, runtime } = {}) {
  const base = { fileId: file.id, caseId: file.caseId, fileHash: file.sha256, updatedAt: new Date().toISOString() };
  let task;
  let doc;
  let taskDestroyed = false;
  const destroyTask = () => {
    if (taskDestroyed || !task?.destroy) return;
    taskDestroyed = true;
    try { Promise.resolve(task.destroy()).catch(() => {}); } catch {}
  };
  try {
    throwIfAborted(signal);
    const pdfjs = runtime || await abortable(loadLocalPdfEngine(), signal);
    throwIfAborted(signal);
    const originalBytes = await abortable(file.original.arrayBuffer(), signal);
    throwIfAborted(signal);
    task = pdfjs.getDocument({ data: new Uint8Array(originalBytes), isEvalSupported: false, useWorkerFetch: false, useSystemFonts: true, stopAtErrors: true });
    doc = await abortable(task.promise, signal, destroyTask);
    throwIfAborted(signal);
    if (doc.numPages > 500) throw Object.assign(new Error("This PDF has more than 500 pages."), { code: "too_many_pages" });
    const pages = [];
    let characters = 0;
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      throwIfAborted(signal);
      const page = await abortable(doc.getPage(pageNumber), signal, destroyTask);
      try {
        const content = await abortable(page.getTextContent({ disableNormalization: false, includeMarkedContent: false }), signal, destroyTask);
        throwIfAborted(signal);
        let text = "";
        for (const item of content.items) {
          if (typeof item.str !== "string") continue;
          if (text && !text.endsWith("\n") && !/^\s/.test(item.str) && !/\s$/.test(text)) text += " ";
          text += item.str;
          if (item.hasEOL) text += "\n";
        }
        characters += text.replace(/\s/g, "").length;
        pages.push({ pageNumber, text });
      } finally {
        page.cleanup?.();
      }
    }
    throwIfAborted(signal);
    if (characters < 20) return { ...base, status: "needs_ocr", message: SCANNED_PDF_BASE_MESSAGE, pages: [] };
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
    if (signal?.aborted || error?.name === "AbortError") {
      return { ...base, status: "cancelled", message: PDF_CANCELLED_MESSAGE, failure: { code: "cancelled", retryable: false } };
    }
    const failure = classifyPdfFailure(error);
    return { ...base, status: "failed", message: failure.message, failure: { code: failure.code, retryable: failure.retryable } };
  } finally {
    try { await doc?.destroy?.(); } catch {}
  }
}
