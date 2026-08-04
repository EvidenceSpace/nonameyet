import { ocrPdfPage } from "./pdf-page-ocr.js";

export const MAX_PDF_OCR_PAGES = 50;
export const MAX_PDF_OCR_CHARACTERS = 500_000;
export const PDF_DOCUMENT_OCR_TIMEOUT_MS = 120_000;
export const MAX_PDF_OCR_WARNING_PAGE_REFERENCES = 20;

function documentOcrError(message, code) {
  return Object.assign(new Error(message), { code });
}

function abortError() {
  return new DOMException("cancelled", "AbortError");
}

function abortable(operation, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      handler(value);
    };
    const onAbort = () => finish(reject, abortError());
    signal?.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(operation).then(
      (value) => finish(resolve, value),
      (error) => finish(reject, error),
    );
  });
}

function deadlineSignal(signal, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw documentOcrError("PDF OCR timeout is invalid.", "invalid_output");
  }
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", onExternalAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onExternalAbort);
    },
  };
}

function validateDocument(document, maxPages) {
  if (!document || typeof document.getPage !== "function"
    || !Number.isSafeInteger(document.numPages) || document.numPages < 1) {
    throw documentOcrError("PDF document is invalid.", "invalid_output");
  }
  if (!Number.isSafeInteger(maxPages) || maxPages < 1) {
    throw documentOcrError("PDF OCR page limit is invalid.", "invalid_output");
  }
  if (document.numPages > maxPages) {
    throw documentOcrError(
      `PDF requires OCR for ${document.numPages} pages; the safe limit is ${maxPages}.`,
      "too_many_pages",
    );
  }
}

function validatePageResult(result) {
  if (!result || typeof result !== "object" || typeof result.text !== "string"
    || !result.text.trim() || typeof result.adapterId !== "string" || !result.adapterId
    || typeof result.adapterVersion !== "string" || !result.adapterVersion) {
    throw documentOcrError("PDF page OCR result is invalid.", "invalid_output");
  }
  if (result.confidence !== undefined
    && (typeof result.confidence !== "number" || !Number.isFinite(result.confidence)
      || result.confidence < 0 || result.confidence > 1)) {
    throw documentOcrError("PDF page OCR confidence is invalid.", "invalid_output");
  }
}

function blankPageWarning(pageNumbers) {
  if (!pageNumbers.length) return [];
  const shown = pageNumbers.slice(0, MAX_PDF_OCR_WARNING_PAGE_REFERENCES);
  const remaining = pageNumbers.length - shown.length;
  const pageLabel = shown.length === 1 ? "page" : "pages";
  return [
    `Local OCR found no readable text on ${pageLabel} ${shown.join(", ")}`
      + (remaining ? ` and ${remaining} more page${remaining === 1 ? "" : "s"}` : "")
      + ". Review the original before using extracted text.",
  ];
}

function reportProgress(onProgress, progress) {
  if (typeof onProgress !== "function") return;
  try {
    onProgress(progress);
  } catch {
    // Progress UI must not break extraction.
  }
}

export async function ocrPdfDocument(document, {
  signal,
  runtime,
  timeoutMs = PDF_DOCUMENT_OCR_TIMEOUT_MS,
  pageTimeoutMs,
  maxPages = MAX_PDF_OCR_PAGES,
  maxCharacters = MAX_PDF_OCR_CHARACTERS,
  onProgress,
  ocrPage = ocrPdfPage,
} = {}) {
  validateDocument(document, maxPages);
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters < 1) {
    throw documentOcrError("PDF OCR character limit is invalid.", "invalid_output");
  }
  const deadline = deadlineSignal(signal, timeoutMs);
  const pages = [];
  const blankPages = [];
  const confidences = [];
  let totalCharacters = 0;
  let adapterId;
  let adapterVersion;
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      let page;
      try {
        const pagePromise = Promise.resolve(document.getPage(pageNumber));
        pagePromise.then((latePage) => {
          if (deadline.signal.aborted && latePage !== page) latePage?.cleanup?.();
        }, () => {});
        page = await abortable(pagePromise, deadline.signal);
        try {
          const result = await abortable(ocrPage(page, {
            signal: deadline.signal,
            runtime,
            ...(pageTimeoutMs === undefined ? {} : { timeoutMs: pageTimeoutMs }),
          }), deadline.signal);
          validatePageResult(result);
          if (adapterId === undefined) {
            adapterId = result.adapterId;
            adapterVersion = result.adapterVersion;
          } else if (result.adapterId !== adapterId || result.adapterVersion !== adapterVersion) {
            throw documentOcrError("PDF page OCR provenance changed during processing.", "invalid_output");
          }
          const separatorCharacters = pages.some((item) => item.text) ? 2 : 0;
          totalCharacters += separatorCharacters + result.text.length;
          if (totalCharacters > maxCharacters) {
            throw documentOcrError("PDF OCR text exceeds the safe document limit.", "output_too_large");
          }
          pages.push({ pageNumber, text: result.text, confidence: result.confidence });
          if (result.confidence !== undefined) confidences.push(result.confidence);
          reportProgress(onProgress, {
            completedPages: pageNumber,
            totalPages: document.numPages,
            pageNumber,
            status: "recognized",
          });
        } catch (error) {
          if (error?.code !== "empty_text") throw error;
          blankPages.push(pageNumber);
          pages.push({ pageNumber, text: "", confidence: undefined });
          reportProgress(onProgress, {
            completedPages: pageNumber,
            totalPages: document.numPages,
            pageNumber,
            status: "blank",
          });
        }
      } finally {
        page?.cleanup?.();
      }
    }
    const readablePages = pages.filter((page) => page.text);
    if (!readablePages.length) {
      throw documentOcrError("Local OCR found no readable text in this PDF.", "empty_text");
    }
    return {
      text: readablePages.map((page) => page.text).join("\n\n"),
      pages,
      warnings: blankPageWarning(blankPages),
      confidence: confidences.length
        ? confidences.reduce((total, value) => total + value, 0) / confidences.length
        : undefined,
      adapterId,
      adapterVersion,
    };
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (deadline.timedOut()) {
      throw documentOcrError("PDF OCR timed out before all pages were processed.", "ocr_timeout");
    }
    throw error;
  } finally {
    deadline.cleanup();
  }
}
