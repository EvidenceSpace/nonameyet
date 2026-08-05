import { isValidExtractionArtifact } from "./extraction-artifact.js";
import { normalizeScannedPdfOcrFailure } from "./scanned-pdf-recovery.js";

export const MIXED_PDF_OCR_RETRY_RUNNING_MESSAGE = "Rechecking pages without readable text locally. Existing extracted text is being kept until this retry produces a valid improvement.";
export const MIXED_PDF_OCR_RETRY_CANCELLED_MESSAGE = "Local OCR retry was cancelled. Existing extracted text was kept.";
export const MIXED_PDF_OCR_RETRY_NO_IMPROVEMENT_MESSAGE = "Local OCR retry did not recover any additional pages. Existing extracted text was kept.";
export const MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE = "CaseFind rejected the local OCR retry result. Existing extracted text was kept.";
export const MIXED_PDF_OCR_RETRY_FAILED_MESSAGE = "Local OCR retry could not finish safely. Existing extracted text was kept.";

function jobMatchesFile(file, job) {
  return Boolean(file && job
    && file.type === "application/pdf"
    && job.fileId === file.id
    && job.caseId === file.caseId
    && job.fileHash === file.sha256);
}

function readable(value) {
  return typeof value === "string" && Boolean(value.trim());
}

export function getMixedPdfOcrRetry({ file, job } = {}) {
  if (!jobMatchesFile(file, job) || job.status !== "ready_for_ai"
    || !isValidExtractionArtifact(job.artifact)) return null;
  const failure = normalizeScannedPdfOcrFailure(job.failure);
  if (!failure?.retryable) return null;
  const readablePages = job.artifact.pages.filter((page) => readable(page.text)).length;
  const missingPages = job.artifact.pages.length - readablePages;
  if (!readablePages || !missingPages) return null;
  return {
    canRetry: true,
    retryLabel: "Retry missing OCR",
    message: `Local OCR did not finish for ${missingPages} PDF page${missingPages === 1 ? "" : "s"}. Existing extracted text will be kept unless a local retry safely recovers more pages.`,
    missingPages,
  };
}

function preserved(notice, reason) {
  return { replaceExisting: false, recoveredPages: 0, notice, reason };
}

export function resolveMixedPdfOcrRetry({ file, previousJob, result } = {}) {
  if (!getMixedPdfOcrRetry({ file, job: previousJob })) {
    return preserved(MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE, "ineligible_previous_job");
  }
  if (result?.status === "cancelled") {
    return preserved(MIXED_PDF_OCR_RETRY_CANCELLED_MESSAGE, "cancelled");
  }
  if (!jobMatchesFile(file, result) || result.status !== "ready_for_ai"
    || !isValidExtractionArtifact(result.artifact)) {
    const expectedFailure = ["failed", "needs_ocr"].includes(result?.status);
    return preserved(
      expectedFailure ? MIXED_PDF_OCR_RETRY_NO_IMPROVEMENT_MESSAGE : MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE,
      expectedFailure ? "processing_failed" : "invalid_result",
    );
  }
  if (result.artifact.adapterId !== "pdfjs-text+local-pdf-ocr") {
    return preserved(MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE, "invalid_ocr_provenance");
  }

  const previousPages = previousJob.artifact.pages;
  const resultPages = result.artifact.pages;
  if (previousPages.length !== resultPages.length) {
    return preserved(MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE, "page_set_changed");
  }

  let recoveredPages = 0;
  for (let index = 0; index < previousPages.length; index += 1) {
    const previousPage = previousPages[index];
    const resultPage = resultPages[index];
    if (previousPage.pageNumber !== resultPage.pageNumber) {
      return preserved(MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE, "page_set_changed");
    }
    const previousReadable = readable(previousPage.text);
    const resultReadable = readable(resultPage.text);
    if (previousReadable && !resultReadable) {
      return preserved(MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE, "readable_page_regressed");
    }
    if (previousReadable && previousPage.text !== resultPage.text) {
      return preserved(MIXED_PDF_OCR_RETRY_REJECTED_MESSAGE, "readable_page_changed");
    }
    if (!previousReadable && resultReadable) recoveredPages += 1;
  }
  if (!recoveredPages) {
    return preserved(MIXED_PDF_OCR_RETRY_NO_IMPROVEMENT_MESSAGE, "no_improvement");
  }
  return { replaceExisting: true, recoveredPages, notice: "", reason: "improved" };
}
