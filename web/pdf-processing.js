import { loadLocalPdfEngine } from "./pdf-engine.js";
import {
  buildPdfOcrCoverageWarnings,
  buildPdfOcrFailureWarnings,
  buildPdfPageCoverageWarnings,
} from "./pdf-page-coverage.js";
import {
  classifyScannedPdfOcrFailure,
  SCANNED_PDF_BASE_MESSAGE,
} from "./scanned-pdf-recovery.js";
import { classifyPdfFailure } from "./pdf-failure-recovery.js";
import { assertOriginalBytesMatchHash } from "./original-byte-integrity.js";
import {
  MAX_PDF_OCR_CHARACTERS,
  PDF_DOCUMENT_OCR_TIMEOUT_MS,
  ocrPdfDocument,
} from "./pdf-document-ocr.js";
import { browserRasterTextDetectorRuntime } from "./raster-text-detector.js";
import { buildImageOcrQuality } from "./image-ocr-quality.js";

export const PDF_CANCELLED_MESSAGE = "Local PDF text extraction was cancelled.";
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_TEXT_CHARACTERS = 2_000_000;
export const PDF_PROCESSING_TIMEOUT_MS = 60_000;
export const PDF_HEADER_SCAN_BYTES = 1024;

function processingError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function hasPdfHeader(input, scanBytes = PDF_HEADER_SCAN_BYTES) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const limit = Math.min(bytes.length, scanBytes);
  for (let index = 0; index <= limit - 5; index += 1) {
    if (bytes[index] === 0x25
      && bytes[index + 1] === 0x50
      && bytes[index + 2] === 0x44
      && bytes[index + 3] === 0x46
      && bytes[index + 4] === 0x2d) return true;
  }
  return false;
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

function reportOcrProgress(callback, progress) {
  if (typeof callback !== "function") return;
  try {
    Promise.resolve(callback(progress)).catch(() => {});
  } catch {
    // Progress reporting must never break local extraction.
  }
}

function validateOcrMetadata(value, label) {
  if (typeof value !== "string" || !value.trim() || value.length > 100) {
    throw processingError("invalid_output", `PDF OCR ${label} is invalid.`);
  }
}

function mapOcrResult(result, originalPageNumbers, maxCharacters) {
  if (!result || typeof result !== "object" || !Array.isArray(result.pages)
    || result.pages.length !== originalPageNumbers.length) {
    throw processingError("invalid_output", "PDF OCR page output is incomplete.");
  }
  validateOcrMetadata(result.adapterId, "adapter identity");
  validateOcrMetadata(result.adapterVersion, "adapter version");
  if (result.confidence !== undefined
    && (typeof result.confidence !== "number" || !Number.isFinite(result.confidence)
      || result.confidence < 0 || result.confidence > 1)) {
    throw processingError("invalid_output", "PDF OCR confidence is invalid.");
  }
  let characters = 0;
  const pages = result.pages.map((page, index) => {
    if (page?.pageNumber !== index + 1 || typeof page.text !== "string") {
      throw processingError("invalid_output", "PDF OCR page order is invalid.");
    }
    if (page.confidence !== undefined
      && (typeof page.confidence !== "number" || !Number.isFinite(page.confidence)
        || page.confidence < 0 || page.confidence > 1)) {
      throw processingError("invalid_output", "PDF OCR page confidence is invalid.");
    }
    characters += page.text.length;
    if (characters > maxCharacters) {
      throw processingError("output_too_large", "PDF OCR text exceeds the safe document limit.");
    }
    return {
      pageNumber: originalPageNumbers[index],
      text: page.text,
      confidence: page.confidence,
    };
  });
  if (!pages.some((page) => page.text.trim())) {
    throw processingError("empty_text", "PDF OCR returned no readable text.");
  }
  return {
    pages,
    confidence: result.confidence,
    adapterId: result.adapterId,
    adapterVersion: result.adapterVersion,
  };
}

function subsetDocument(document, pageNumbers) {
  return {
    numPages: pageNumbers.length,
    getPage(index) {
      if (!Number.isInteger(index) || index < 1 || index > pageNumbers.length) {
        throw processingError("invalid_output", "PDF OCR requested an invalid page.");
      }
      return document.getPage(pageNumbers[index - 1]);
    },
  };
}

function mergeOcrPages(selectablePages, ocrPages) {
  const byPage = new Map(ocrPages.map((page) => [page.pageNumber, page.text]));
  return selectablePages.map((page) => byPage.has(page.pageNumber)
    ? { pageNumber: page.pageNumber, text: byPage.get(page.pageNumber) }
    : page);
}

function artifactText(pages) {
  return pages.map((page) => page.text.trim()).filter(Boolean).join("\n\n");
}

function textReadyMessage(pages, warnings, usedOcr) {
  const readablePages = pages.filter((page) => page.text.trim()).length;
  if (usedOcr) {
    const coverage = readablePages === pages.length
      ? `${pages.length} page${pages.length === 1 ? "" : "s"}`
      : `${readablePages} of ${pages.length} pages`;
    const coverageWarning = warnings.find((warning) => /no readable text after local OCR/.test(warning));
    return `Text ready from ${coverage} using selectable text and local OCR. Review OCR text against the original.${coverageWarning ? ` ${coverageWarning}` : ""}`;
  }
  return warnings.length
    ? `Text ready from ${readablePages} of ${pages.length} pages. ${warnings[0]}`
    : `Text ready from ${pages.length} page${pages.length === 1 ? "" : "s"}.`;
}

export async function processPdf(file, {
  signal,
  runtime,
  ocrRuntime,
  ocrDocument = ocrPdfDocument,
  onOcrProgress,
  ocrTimeoutMs = PDF_DOCUMENT_OCR_TIMEOUT_MS,
  maxBytes = MAX_PDF_BYTES,
  maxTextCharacters = MAX_PDF_TEXT_CHARACTERS,
  timeoutMs = PDF_PROCESSING_TIMEOUT_MS,
  cryptoImpl = globalThis.crypto,
} = {}) {
  const base = {
    fileId: file.id,
    caseId: file.caseId,
    fileHash: file.sha256,
    updatedAt: new Date().toISOString(),
  };
  let deadline = createDeadlineSignal(signal, timeoutMs);
  let workSignal = deadline.signal;
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
    if (originalBytes.byteLength > maxBytes) {
      throw processingError("file_too_large", "PDF exceeds local byte limit.");
    }
    const pdfData = new Uint8Array(originalBytes);
    if (!hasPdfHeader(pdfData)) {
      throw processingError("invalid_pdf_signature", "PDF header is missing.");
    }
    await abortable(assertOriginalBytesMatchHash(pdfData, file.sha256, { cryptoImpl }), workSignal);
    throwIfAborted(workSignal);
    const pdfjs = runtime || await abortable(loadLocalPdfEngine(), workSignal);
    throwIfAborted(workSignal);
    task = pdfjs.getDocument({
      data: pdfData,
      isEvalSupported: false,
      useWorkerFetch: false,
      useSystemFonts: true,
      stopAtErrors: true,
    });
    doc = await abortable(task.promise, workSignal, destroyTask);
    throwIfAborted(workSignal);
    if (doc.numPages > 500) {
      throw processingError("too_many_pages", "This PDF has more than 500 pages.");
    }
    const pages = [];
    const pagesWithoutText = [];
    let extractedCharacters = 0;
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      throwIfAborted(workSignal);
      const page = await abortable(doc.getPage(pageNumber), workSignal, destroyTask);
      try {
        const content = await abortable(page.getTextContent({
          disableNormalization: false,
          includeMarkedContent: false,
        }), workSignal, destroyTask);
        throwIfAborted(workSignal);
        let text = "";
        for (const item of content.items) {
          if (typeof item.str !== "string") continue;
          const separator = text && !text.endsWith("\n") && !/^\s/.test(item.str)
            && !/\s$/.test(text) ? " " : "";
          const ending = item.hasEOL ? "\n" : "";
          extractedCharacters += separator.length + item.str.length + ending.length;
          if (extractedCharacters > maxTextCharacters) {
            throw processingError("text_limit_exceeded", "PDF selectable text exceeds local character limit.");
          }
          text += separator + item.str + ending;
        }
        if (!text.trim()) pagesWithoutText.push(pageNumber);
        pages.push({ pageNumber, text });
      } finally {
        page.cleanup?.();
      }
    }

    throwIfAborted(workSignal);
    let mergedPages = pages;
    let ocr;
    let ocrFailure;
    let ocrFailureWarnings = [];
    const selectedOcrRuntime = ocrRuntime === undefined
      ? browserRasterTextDetectorRuntime()
      : ocrRuntime;
    if (pagesWithoutText.length && selectedOcrRuntime) {
      if (!Number.isFinite(ocrTimeoutMs) || ocrTimeoutMs <= 0) {
        throw processingError("invalid_output", "PDF OCR time limit is invalid.");
      }
      deadline.cleanup();
      deadline = createDeadlineSignal(signal, ocrTimeoutMs + 1_000);
      workSignal = deadline.signal;
      const remainingBudget = Math.min(
        MAX_PDF_OCR_CHARACTERS,
        maxTextCharacters - extractedCharacters,
      );
      try {
        if (remainingBudget < 1) {
          throw processingError("output_too_large", "No safe character budget remains for PDF OCR.");
        }
        const originalPageNumbers = [...pagesWithoutText];
        reportOcrProgress(onOcrProgress, {
          completedPages: 0,
          totalPages: originalPageNumbers.length,
          pageNumber: originalPageNumbers[0],
          status: "starting",
        });
        const rawOcr = await abortable(ocrDocument(
          subsetDocument(doc, originalPageNumbers),
          {
            signal: workSignal,
            runtime: selectedOcrRuntime,
            maxCharacters: remainingBudget,
            timeoutMs: ocrTimeoutMs,
            onProgress: typeof onOcrProgress === "function"
              ? (progress) => reportOcrProgress(onOcrProgress, {
                ...progress,
                pageNumber: originalPageNumbers[progress.pageNumber - 1],
                totalPages: originalPageNumbers.length,
              })
              : undefined,
          },
        ), workSignal, destroyTask);
        throwIfAborted(workSignal);
        ocr = mapOcrResult(rawOcr, originalPageNumbers, remainingBudget);
        mergedPages = mergeOcrPages(pages, ocr.pages);
      } catch (error) {
        if (workSignal.aborted) throw error;
        ocrFailure = classifyScannedPdfOcrFailure(error);
        ocrFailureWarnings = buildPdfOcrFailureWarnings(pagesWithoutText);
      }
    } else if (pagesWithoutText.length) {
      ocrFailure = { code: "ocr_unavailable", retryable: false };
    }

    throwIfAborted(workSignal);
    const readableCharacters = mergedPages.reduce(
      (total, page) => total + page.text.replace(/\s/g, "").length,
      0,
    );
    if (readableCharacters < 20) {
      ocrFailure ||= { code: "insufficient_text", retryable: false };
      return {
        ...base,
        status: "needs_ocr",
        message: SCANNED_PDF_BASE_MESSAGE,
        pages: [],
        failure: ocrFailure,
      };
    }

    const usedOcr = Boolean(ocr?.pages.some((page) => page.text.trim()));
    const unresolvedPages = usedOcr
      ? ocr.pages.filter((page) => !page.text.trim()).map((page) => page.pageNumber)
      : pagesWithoutText;
    let warnings = usedOcr
      ? buildPdfOcrCoverageWarnings(unresolvedPages)
      : ocrFailureWarnings.length
        ? ocrFailureWarnings
        : buildPdfPageCoverageWarnings(unresolvedPages);
    let quality;
    if (usedOcr) {
      quality = buildImageOcrQuality(ocr.confidence);
      if (quality.warning && !warnings.includes(quality.warning)) {
        warnings = [...warnings, quality.warning];
      }
    }

    const hasSelectableText = pages.some((page) => page.text.trim());
    const adapterId = usedOcr
      ? hasSelectableText ? "pdfjs-text+local-pdf-ocr" : "local-pdf-ocr"
      : "pdfjs-text";
    const adapterVersion = usedOcr
      ? `1.0.0+pdfjs-${pdfjs.version}+${ocr.adapterId}-${ocr.adapterVersion}`
      : `1.0.0+pdfjs-${pdfjs.version}`;
    if (adapterVersion.length > 200) {
      throw processingError("invalid_output", "Combined PDF extraction provenance is too long.");
    }
    return {
      ...base,
      status: "ready_for_ai",
      message: textReadyMessage(mergedPages, warnings, usedOcr),
      ...(ocrFailure ? { failure: ocrFailure } : {}),
      artifact: {
        adapterId,
        adapterVersion,
        pages: mergedPages,
        text: artifactText(mergedPages),
        warnings,
        ...(quality ? { quality } : {}),
      },
    };
  } catch (error) {
    if (signal?.aborted) {
      return {
        ...base,
        status: "cancelled",
        message: PDF_CANCELLED_MESSAGE,
        failure: { code: "cancelled", retryable: false },
      };
    }
    const failure = classifyPdfFailure(deadline.timedOut()
      ? processingError("processing_timeout", "PDF processing timed out.")
      : error);
    return {
      ...base,
      status: "failed",
      message: failure.message,
      failure: { code: failure.code, retryable: failure.retryable },
    };
  } finally {
    deadline.cleanup();
    try { await doc?.destroy?.(); } catch {}
  }
}
