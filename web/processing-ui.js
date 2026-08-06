import { getFilesForCase, getProcessingForCase, getSuggestionsForCase, saveProcessing, saveProcessingIfCurrent, saveSuggestion } from "./storage.js";
import { processPdf } from "./pdf-processing.js";
import { buildPdfOcrProgressView, createPdfOcrProgressTracker } from "./pdf-ocr-progress.js";
import { createProcessingFileIndex, resolveProcessingFileForRow } from "./processing-row-identity.js";
import { browserTextDetectorRuntime, processImage } from "./image-ocr.js";
import { formatImageOcrQuality } from "./image-ocr-quality.js";
import { canStartImageOcr, inspectImageOcrReadiness, IMAGE_OCR_UNAVAILABLE_MESSAGE } from "./image-ocr-readiness.js";
import { getScannedPdfRecovery } from "./scanned-pdf-recovery.js";
import {
  getMixedPdfOcrRetry,
  MIXED_PDF_OCR_RETRY_FAILED_MESSAGE,
  MIXED_PDF_OCR_RETRY_RUNNING_MESSAGE,
  MIXED_PDF_OCR_RETRY_STALE_MESSAGE,
  resolveMixedPdfOcrRetry,
} from "./mixed-pdf-ocr-retry.js";
import { requestAnalysis } from "./analysis-client.js";
import { inspectProcessingJob } from "./processing-integrity.js";
import {
  buildUnexpectedProcessingFailure,
  PROCESSING_STORAGE_UNAVAILABLE_MESSAGE,
} from "./processing-run-recovery.js";
import {
  PROCESSING_ACTIVE_ELSEWHERE_MESSAGE,
  PROCESSING_BUSY_MESSAGE,
  PROCESSING_LEASE_UNAVAILABLE_MESSAGE,
  PROCESSING_OWNERSHIP_UNCONFIRMED_MESSAGE,
  processingLeaseSupported,
  withProcessingLease,
} from "./processing-lease.js";
import { recoverOrphanedProcessingRuns } from "./processing-orphan-recovery.js";
import { buildGroundedSuggestions } from "./suggestion-handoff.js";

const caseId = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#file-list");
const imageOcrRuntime = browserTextDetectorRuntime();
const imageOcrReadiness = inspectImageOcrReadiness();
let refreshing = false;
let refreshDone = Promise.resolve();
const labels = {
  extracting: "Processing…",
  ready_for_ai: "Text ready",
  needs_ocr: "OCR needed",
  failed: "Failed",
  cancelled: "Cancelled",
  ocr_unavailable: "OCR unavailable",
};
const controllers = new Map();
const leaseRequests = new Set();
const pdfOcrProgress = createPdfOcrProgressTracker();
const mixedPdfRetryRuns = new Set();
const processingNotices = new Map();
const PROCESSING_STALE_MESSAGE = "Local processing changed while this run was working. This result was not saved; review the current text status before trying again.";

const viewer = document.createElement("dialog");
viewer.className = "text-source-dialog";
viewer.innerHTML = `<div class="text-source-head"><div><span class="section-label">EXTRACTED SOURCE TEXT</span><h2 id="text-source-title"></h2></div><button class="dialog-close" id="close-text-source" type="button" aria-label="Close">×</button></div><div class="text-source-trust">Local extraction only · Review the original record before confirming any fact.</div><div class="text-source-trust" id="text-source-warnings" role="status" hidden></div><div class="text-source-meta"><span id="text-source-page"></span><span id="text-source-adapter"></span><span id="text-source-quality" hidden></span></div><pre id="text-source-content"></pre><div class="text-source-footer"><code id="text-source-hash"></code><div><button class="button-secondary" id="previous-text-page" type="button">Previous</button><button class="button-secondary" id="next-text-page" type="button">Next</button></div></div>`;
document.body.append(viewer);
viewer.querySelector("#close-text-source").onclick = () => viewer.close();

let viewedPages = [];
let viewedIndex = 0;
function renderViewedPage() {
  const page = viewedPages[viewedIndex];
  viewer.querySelector("#text-source-page").textContent = `Page ${page.pageNumber} of ${viewedPages.length}`;
  viewer.querySelector("#text-source-content").textContent = page.text || "No readable text was extracted from this page.";
  viewer.querySelector("#previous-text-page").disabled = viewedIndex === 0;
  viewer.querySelector("#next-text-page").disabled = viewedIndex === viewedPages.length - 1;
}
viewer.querySelector("#previous-text-page").onclick = () => {
  if (viewedIndex > 0) {
    viewedIndex -= 1;
    renderViewedPage();
  }
};
viewer.querySelector("#next-text-page").onclick = () => {
  if (viewedIndex < viewedPages.length - 1) {
    viewedIndex += 1;
    renderViewedPage();
  }
};

function openTextSource(file, job) {
  viewedPages = job.artifact?.pages || [];
  if (!viewedPages.length) return;
  viewedIndex = 0;
  viewer.querySelector("#text-source-title").textContent = file.name;
  viewer.querySelector("#text-source-adapter").textContent = job.artifact.adapterVersion;
  const qualityNode = viewer.querySelector("#text-source-quality");
  const qualityLabel = formatImageOcrQuality(job.artifact?.quality);
  qualityNode.hidden = !qualityLabel;
  qualityNode.textContent = qualityLabel;
  viewer.querySelector("#text-source-hash").textContent = `SHA-256 ${job.fileHash}`;
  const warningNode = viewer.querySelector("#text-source-warnings");
  const warnings = job.artifact?.warnings || [];
  warningNode.hidden = !warnings.length;
  warningNode.textContent = warnings.join(" ");
  renderViewedPage();
  viewer.showModal();
}

function renderOcrReadinessNotice(files) {
  const hasSupportedImage = files.some((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type));
  let notice = root.parentElement?.querySelector(":scope > .ocr-readiness-notice");
  if (!hasSupportedImage || imageOcrReadiness.available) {
    notice?.remove();
    return;
  }
  if (!notice) {
    notice = document.createElement("aside");
    notice.className = "ocr-readiness-notice";
    notice.setAttribute("role", "status");
    root.before(notice);
  }
  notice.innerHTML = `<span aria-hidden="true">i</span><div><strong>${imageOcrReadiness.label}</strong><small>${imageOcrReadiness.message}</small></div>`;
}

function ensureProcessingNote(row) {
  let note = row.querySelector(".processing-note");
  if (!note) {
    note = document.createElement("p");
    note.className = "processing-note";
    row.append(note);
  }
  note.setAttribute("role", "status");
  note.setAttribute("aria-live", "polite");
  return note;
}

function setProcessingNote(row, message) {
  const note = row.querySelector(".processing-note");
  if (!message) {
    note?.remove();
    return;
  }
  const target = note || ensureProcessingNote(row);
  if (target.textContent !== message) target.textContent = message;
}

function setPdfOcrMeter(row, progress) {
  const view = buildPdfOcrProgressView(progress);
  let meter = row.querySelector(".pdf-ocr-meter");
  if (!view) {
    meter?.remove();
    return;
  }
  if (!meter) {
    meter = document.createElement("div");
    meter.className = "pdf-ocr-meter";
    const bar = document.createElement("progress");
    bar.setAttribute("aria-label", "Local PDF OCR progress");
    const label = document.createElement("span");
    label.setAttribute("aria-hidden", "true");
    meter.append(bar, label);
    row.append(meter);
  }
  const bar = meter.querySelector("progress");
  const label = meter.querySelector("span");
  bar.max = view.max;
  bar.value = view.value;
  bar.setAttribute("aria-valuetext", view.ariaValueText);
  if (label.textContent !== view.label) label.textContent = view.label;
}

function showLivePdfOcrProgress(fileId, message, progress) {
  if (!root || !message) return;
  const row = [...root.querySelectorAll(".file-row")]
    .find((candidate) => candidate.dataset.fileId === fileId);
  if (row) {
    setProcessingNote(row, message);
    setPdfOcrMeter(row, progress);
  }
}

function showProcessingNotice(fileId, message) {
  processingNotices.set(fileId, message);
  if (!root || !message) return;
  const row = [...root.querySelectorAll(".file-row")]
    .find((candidate) => candidate.dataset.fileId === fileId);
  if (row) setProcessingNote(row, message);
}

async function refresh() {
  if (!caseId || !root) return;
  if (refreshing) return refreshDone;
  let resolveRefresh;
  refreshing = true;
  refreshDone = new Promise((resolve) => { resolveRefresh = resolve; });
  try {
    const [files, jobs] = await Promise.all([getFilesForCase(caseId), getProcessingForCase(caseId)]);
    const filesById = createProcessingFileIndex(files);
    renderOcrReadinessNotice(files);
    [...root.querySelectorAll(".file-row")].forEach((row) => {
      const file = resolveProcessingFileForRow(row, filesById);
      if (!file) return;
      const actions = row.querySelector(".file-actions");
      if (!actions) return;
      const job = jobs.find((item) => item.fileId === file.id);
      const inspection = inspectProcessingJob(file, job);
      const storedStatus = inspection.status;
      const mixedPdfRetry = file.type === "application/pdf"
        ? getMixedPdfOcrRetry({ file, job })
        : null;
      const mixedPdfRetryActive = mixedPdfRetryRuns.has(file.id) && controllers.has(file.id);
      const status = mixedPdfRetryActive ? "extracting" : storedStatus;
      const isImage = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
      const imageOcrUnavailable = isImage && !imageOcrReadiness.available && ["unprocessed", "failed", "cancelled"].includes(status);
      const scannedPdfRecovery = file.type === "application/pdf"
        ? getScannedPdfRecovery({
          status,
          imageOcrAvailable: imageOcrReadiness.available,
          failure: job?.failure,
        })
        : null;
      const displayedStatus = imageOcrUnavailable ? "ocr_unavailable" : status;
      const pdfFailureNeedsAttention = file.type === "application/pdf" && status === "failed" && job?.failure?.retryable === false;
      const imageFailureNeedsAttention = isImage && status === "failed" && job?.failure?.retryable === false;

      let badge = actions.querySelector(".processing-status");
      if (!badge) {
        badge = document.createElement("span");
        actions.prepend(badge);
      }
      badge.className = `processing-status ${displayedStatus}`;
      badge.textContent = scannedPdfRecovery?.label || (pdfFailureNeedsAttention || imageFailureNeedsAttention ? "Needs attention" : labels[displayedStatus] || "Not processed");

      let processButton = actions.querySelector(".process-file");
      const canProcessPdf = file.type === "application/pdf"
        && !controllers.has(file.id)
        && !leaseRequests.has(file.id)
        && (!job
          || status === "cancelled"
          || (status === "failed" && job?.failure?.retryable !== false)
          || scannedPdfRecovery?.canRetryPdfExtraction
          || mixedPdfRetry?.canRetry);
      const canProcessImage = canStartImageOcr({
        fileType: file.type,
        jobStatus: job && status,
        failureCode: job?.failure?.code,
        readiness: imageOcrReadiness,
      });
      const canProcess = canProcessPdf || canProcessImage;
      if (canProcess && !processButton) {
        processButton = document.createElement("button");
        processButton.type = "button";
        processButton.className = "process-file";
        actions.insertBefore(processButton, badge.nextSibling);
      }
      if (processButton) {
        if (canProcess) {
          processButton.textContent = mixedPdfRetry?.retryLabel
            || scannedPdfRecovery?.retryLabel
            || (job ? "Retry" : file.type === "application/pdf" ? "Extract text" : "Run local OCR");
          processButton.onclick = () => run(file, mixedPdfRetry ? { preserveJob: job } : undefined);
        }
        else processButton.remove();
      }

      let cancelButton = actions.querySelector(".cancel-processing");
      if (status === "extracting" && controllers.has(file.id)) {
        if (!cancelButton) {
          cancelButton = document.createElement("button");
          cancelButton.type = "button";
          cancelButton.className = "cancel-processing";
          cancelButton.textContent = "Cancel";
          actions.insertBefore(cancelButton, badge.nextSibling);
        }
        cancelButton.onclick = () => controllers.get(file.id)?.abort();
      } else cancelButton?.remove();

      let viewButton = actions.querySelector(".view-extracted-text");
      if (status === "ready_for_ai" && job.artifact?.pages?.length) {
        if (!viewButton) {
          viewButton = document.createElement("button");
          viewButton.type = "button";
          viewButton.className = "view-extracted-text";
          actions.insertBefore(viewButton, actions.querySelector(".preview-file"));
        }
        viewButton.textContent = "View text";
        viewButton.onclick = () => openTextSource(file, job);
        let analyzeButton = actions.querySelector(".analyze-record");
        if (!analyzeButton) {
          analyzeButton = document.createElement("button");
          analyzeButton.type = "button";
          analyzeButton.className = "analyze-record";
          actions.insertBefore(analyzeButton, viewButton);
        }
        analyzeButton.textContent = "Find details";
        analyzeButton.onclick = () => analyze(file, job, row, analyzeButton);
      } else {
        viewButton?.remove();
        actions.querySelector(".analyze-record")?.remove();
      }

      const livePdfProgress = file.type === "application/pdf" && status === "extracting"
        ? pdfOcrProgress.message(file.id)
        : "";
      const livePdfProgressValue = file.type === "application/pdf" && status === "extracting"
        ? pdfOcrProgress.progress(file.id)
        : null;
      const mixedRetryMessage = mixedPdfRetryActive && !livePdfProgress
        ? MIXED_PDF_OCR_RETRY_RUNNING_MESSAGE
        : "";
      const crossTabProcessingMessage = status === "extracting" && !controllers.has(file.id)
        ? (processingLeaseSupported()
          ? PROCESSING_ACTIVE_ELSEWHERE_MESSAGE
          : PROCESSING_OWNERSHIP_UNCONFIRMED_MESSAGE)
        : "";
      const noteMessage = livePdfProgress || mixedRetryMessage || processingNotices.get(file.id) || crossTabProcessingMessage || (imageOcrUnavailable
        ? IMAGE_OCR_UNAVAILABLE_MESSAGE
        : mixedPdfRetry?.message || scannedPdfRecovery?.message || inspection.message);
      setProcessingNote(row, noteMessage);
      setPdfOcrMeter(row, livePdfProgressValue);
    });
  } finally {
    refreshing = false;
    resolveRefresh();
  }
}

async function refreshLatest() {
  if (refreshing) await refreshDone;
  await refresh();
}

async function analyze(file, job, row, button) {
  if (!confirm(`Send extracted text from “${file.name}” to the configured AI provider?\n\nThe original file stays on this device. AI results are suggestions only and must be reviewed.`)) return;
  button.disabled = true;
  button.textContent = "Analyzing…";
  const note = ensureProcessingNote(row);
  try {
    const candidates = await requestAnalysis({ file, processingJob: job, consentAccepted: true });
    const grounded = buildGroundedSuggestions({ caseId, file, processingJob: job, candidates });
    const existing = await getSuggestionsForCase(caseId);
    const fingerprints = new Set(existing.map((item) => `${item.fileId}\0${item.label}\0${item.value}\0${item.sourceReference?.locator?.quote || ""}`));
    let saved = 0;
    for (const item of grounded) {
      const key = `${item.fileId}\0${item.label}\0${item.value}\0${item.sourceReference.locator.quote}`;
      if (!fingerprints.has(key)) {
        await saveSuggestion(item);
        saved += 1;
      }
    }
    if (saved) location.reload();
    else {
      note.textContent = "No new source-grounded details were found.";
      button.disabled = false;
      button.textContent = "Find details";
    }
  } catch (error) {
    note.textContent = error?.code === "analysis_unavailable" ? "AI analysis is not configured for this preview." : "Analysis failed safely. No suggestions were saved.";
    button.disabled = false;
    button.textContent = "Retry analysis";
  }
}

async function run(file, options = {}) {
  if (controllers.has(file.id) || leaseRequests.has(file.id)) return;
  processingNotices.delete(file.id);
  leaseRequests.add(file.id);
  try {
    const lease = await withProcessingLease(file.id, () => runOwned(file, options));
    if (!lease.acquired) {
      showProcessingNotice(file.id, lease.reason === "busy"
        ? PROCESSING_BUSY_MESSAGE
        : PROCESSING_LEASE_UNAVAILABLE_MESSAGE);
      try {
        await refreshLatest();
      } catch {
        showProcessingNotice(file.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE);
      }
    }
  } catch {
    showProcessingNotice(file.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE);
  } finally {
    leaseRequests.delete(file.id);
  }
}

async function runOwned(file, { preserveJob } = {}) {
  if (controllers.has(file.id)) return;
  const mixedPdfRetry = preserveJob ? getMixedPdfOcrRetry({ file, job: preserveJob }) : null;
  if (preserveJob && !mixedPdfRetry) return;
  const preserveExisting = Boolean(mixedPdfRetry);
  processingNotices.delete(file.id);
  const controller = new AbortController();
  controllers.set(file.id, controller);
  const isPdf = file.type === "application/pdf";
  if (isPdf) pdfOcrProgress.start(file.id, controller);
  if (preserveExisting) mixedPdfRetryRuns.add(file.id);
  let runMarker;
  let runMarkerSaved = false;
  try {
    if (!preserveExisting) {
      runMarker = {
        fileId: file.id,
        caseId,
        fileHash: file.sha256,
        runId: crypto.randomUUID(),
        status: "extracting",
        message: isPdf
          ? "Reading this PDF locally and checking pages that may need OCR…"
          : "Running OCR locally in this browser…",
        updatedAt: new Date().toISOString(),
      };
      await saveProcessing(runMarker);
      runMarkerSaved = true;
    }
    await refreshLatest();
    const result = isPdf
      ? await processPdf(file, {
        signal: controller.signal,
        onOcrProgress(progress) {
          const message = pdfOcrProgress.update(file.id, controller, progress);
          if (message) {
            showLivePdfOcrProgress(
              file.id,
              message,
              pdfOcrProgress.progress(file.id),
            );
          }
        },
      })
      : await processImage(file, { signal: controller.signal, runtime: imageOcrRuntime });
    if (preserveExisting) {
      const outcome = resolveMixedPdfOcrRetry({ file, previousJob: preserveJob, result });
      if (outcome.replaceExisting) {
        const replaced = await saveProcessingIfCurrent(preserveJob, result);
        if (!replaced) processingNotices.set(file.id, MIXED_PDF_OCR_RETRY_STALE_MESSAGE);
      } else processingNotices.set(file.id, outcome.notice);
    } else {
      const replaced = await saveProcessingIfCurrent(runMarker, result);
      if (!replaced) processingNotices.set(file.id, PROCESSING_STALE_MESSAGE);
    }
  } catch {
    if (preserveExisting) {
      showProcessingNotice(file.id, MIXED_PDF_OCR_RETRY_FAILED_MESSAGE);
    } else if (runMarkerSaved) {
      try {
        const failure = buildUnexpectedProcessingFailure(runMarker);
        const replaced = await saveProcessingIfCurrent(runMarker, failure);
        showProcessingNotice(file.id, replaced ? failure.message : PROCESSING_STALE_MESSAGE);
      } catch {
        showProcessingNotice(file.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE);
      }
    } else {
      showProcessingNotice(file.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE);
    }
  } finally {
    if (controllers.get(file.id) === controller) controllers.delete(file.id);
    if (isPdf) pdfOcrProgress.finish(file.id, controller);
    if (preserveExisting) mixedPdfRetryRuns.delete(file.id);
    try {
      await refreshLatest();
    } catch {
      showProcessingNotice(file.id, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE);
    }
  }
}

let crossTabRecovery = null;
async function recoverCrossTabProcessing() {
  if (!caseId || document.visibilityState === "hidden") return;
  if (crossTabRecovery) return crossTabRecovery;
  crossTabRecovery = (async () => {
    try {
      await recoverOrphanedProcessingRuns(caseId);
      await refreshLatest();
    } catch {
      if (root) {
        [...root.querySelectorAll(".file-row")].forEach((row) => {
          const fileId = row.dataset.fileId;
          if (fileId && !controllers.has(fileId) && row.querySelector(".processing-status.extracting")) {
            showProcessingNotice(fileId, PROCESSING_STORAGE_UNAVAILABLE_MESSAGE);
          }
        });
      }
    } finally {
      crossTabRecovery = null;
    }
  })();
  return crossTabRecovery;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void recoverCrossTabProcessing();
});
window.addEventListener("focus", () => { void recoverCrossTabProcessing(); });

if (root) {
  new MutationObserver(() => queueMicrotask(refresh)).observe(root, { childList: true, subtree: true });
  refresh();
}
