export const MAX_PDF_OCR_PROGRESS_PAGES = 50;
export const MAX_PDF_PROGRESS_PAGE_NUMBER = 500;

const progressStatuses = new Set(["starting", "recognized", "blank"]);

export function normalizePdfOcrProgress(progress) {
  if (!progress || typeof progress !== "object") return null;
  const { completedPages, totalPages, pageNumber, status } = progress;
  if (!Number.isSafeInteger(totalPages) || totalPages < 1
    || totalPages > MAX_PDF_OCR_PROGRESS_PAGES
    || !Number.isSafeInteger(pageNumber) || pageNumber < 1
    || pageNumber > MAX_PDF_PROGRESS_PAGE_NUMBER
    || !progressStatuses.has(status)) return null;
  const minimumCompleted = status === "starting" ? 0 : 1;
  if (!Number.isSafeInteger(completedPages) || completedPages < minimumCompleted
    || completedPages > totalPages
    || (status === "starting" && completedPages !== 0)) return null;
  return { completedPages, totalPages, pageNumber, status };
}

export function formatPdfOcrProgress(progress) {
  const value = normalizePdfOcrProgress(progress);
  if (!value) return "";
  const pages = value.totalPages === 1 ? "page" : "pages";
  if (value.status === "starting") {
    return `Local OCR is checking ${value.totalPages} ${pages} without selectable text.`;
  }
  const outcome = value.status === "recognized" ? "Text found" : "No readable text found";
  return `Local OCR checked ${value.completedPages} of ${value.totalPages} ${pages} without selectable text · ${outcome} on PDF page ${value.pageNumber}.`;
}

export function buildPdfOcrProgressView(progress) {
  const value = normalizePdfOcrProgress(progress);
  if (!value) return null;
  const pages = value.totalPages === 1 ? "page" : "pages";
  return {
    max: value.totalPages,
    value: value.completedPages,
    label: `${value.completedPages} / ${value.totalPages} ${pages}`,
    ariaValueText: `${value.completedPages} of ${value.totalPages} PDF ${pages} checked by local OCR.`,
  };
}

function followsAcceptedProgress(previous, next) {
  if (!previous) return next.status === "starting";
  if (previous.totalPages !== next.totalPages || next.status === "starting") return false;
  if (next.completedPages !== previous.completedPages + 1) return false;
  if (previous.status === "starting") return next.pageNumber === previous.pageNumber;
  return next.pageNumber > previous.pageNumber;
}

export function createPdfOcrProgressTracker() {
  const sessions = new Map();
  return {
    start(fileId, token) {
      if (typeof fileId !== "string" || !fileId.trim() || token == null) return false;
      sessions.set(fileId, { token, message: "", progress: null });
      return true;
    },
    update(fileId, token, progress) {
      const session = sessions.get(fileId);
      if (!session || session.token !== token) return "";
      const value = normalizePdfOcrProgress(progress);
      if (!value || !followsAcceptedProgress(session.progress, value)) return "";
      const message = formatPdfOcrProgress(value);
      session.progress = value;
      session.message = message;
      return message;
    },
    message(fileId) {
      return sessions.get(fileId)?.message || "";
    },
    progress(fileId) {
      const progress = sessions.get(fileId)?.progress;
      return progress ? { ...progress } : null;
    },
    finish(fileId, token) {
      const session = sessions.get(fileId);
      if (!session || session.token !== token) return false;
      sessions.delete(fileId);
      return true;
    },
  };
}
