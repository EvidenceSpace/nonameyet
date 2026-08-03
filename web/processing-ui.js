import { getFilesForCase, getProcessingForCase, getSuggestionsForCase, saveProcessing, saveSuggestion } from "./storage.js";
import { processPdf } from "./pdf-processing.js";
import { browserTextDetectorRuntime, processImage } from "./image-ocr.js";
import { canStartImageOcr, inspectImageOcrReadiness, IMAGE_OCR_UNAVAILABLE_MESSAGE } from "./image-ocr-readiness.js";
import { getScannedPdfRecovery } from "./scanned-pdf-recovery.js";
import { requestAnalysis } from "./analysis-client.js";
import { inspectProcessingJob } from "./processing-integrity.js";
import { buildGroundedSuggestions } from "./suggestion-handoff.js";

const caseId = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#file-list");
const imageOcrRuntime = browserTextDetectorRuntime();
const imageOcrReadiness = inspectImageOcrReadiness();
let refreshing = false;
const labels = {
  extracting: "Processing…",
  ready_for_ai: "Text ready",
  needs_ocr: "OCR needed",
  failed: "Failed",
  cancelled: "Cancelled",
  ocr_unavailable: "OCR unavailable",
};
const controllers = new Map();

const viewer = document.createElement("dialog");
viewer.className = "text-source-dialog";
viewer.innerHTML = `<div class="text-source-head"><div><span class="section-label">EXTRACTED SOURCE TEXT</span><h2 id="text-source-title"></h2></div><button class="dialog-close" id="close-text-source" type="button" aria-label="Close">×</button></div><div class="text-source-trust">Local extraction only · Review the original record before confirming any fact.</div><div class="text-source-trust" id="text-source-warnings" role="status" hidden></div><div class="text-source-meta"><span id="text-source-page"></span><span id="text-source-adapter"></span></div><pre id="text-source-content"></pre><div class="text-source-footer"><code id="text-source-hash"></code><div><button class="button-secondary" id="previous-text-page" type="button">Previous</button><button class="button-secondary" id="next-text-page" type="button">Next</button></div></div>`;
document.body.append(viewer);
viewer.querySelector("#close-text-source").onclick = () => viewer.close();

let viewedPages = [];
let viewedIndex = 0;
function renderViewedPage() {
  const page = viewedPages[viewedIndex];
  viewer.querySelector("#text-source-page").textContent = `Page ${page.pageNumber} of ${viewedPages.length}`;
  viewer.querySelector("#text-source-content").textContent = page.text || "No selectable text on this page.";
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

async function refresh() {
  if (!caseId || !root || refreshing) return;
  refreshing = true;
  try {
    const [files, jobs] = await Promise.all([getFilesForCase(caseId), getProcessingForCase(caseId)]);
    renderOcrReadinessNotice(files);
    [...root.querySelectorAll(".file-row")].forEach((row, index) => {
      const file = files[index];
      if (!file) return;
      const actions = row.querySelector(".file-actions");
      if (!actions) return;
      const job = jobs.find((item) => item.fileId === file.id);
      const inspection = inspectProcessingJob(file, job);
      const status = inspection.status;
      const isImage = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
      const imageOcrUnavailable = isImage && !imageOcrReadiness.available && ["unprocessed", "failed", "cancelled"].includes(status);
      const scannedPdfRecovery = file.type === "application/pdf"
        ? getScannedPdfRecovery({ status, imageOcrAvailable: imageOcrReadiness.available })
        : null;
      const displayedStatus = imageOcrUnavailable ? "ocr_unavailable" : status;

      let badge = actions.querySelector(".processing-status");
      if (!badge) {
        badge = document.createElement("span");
        actions.prepend(badge);
      }
      badge.className = `processing-status ${displayedStatus}`;
      badge.textContent = scannedPdfRecovery?.label || labels[displayedStatus] || "Not processed";

      let processButton = actions.querySelector(".process-file");
      const canProcessPdf = file.type === "application/pdf" && (!job || status === "failed" || status === "cancelled");
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
        processButton.onclick = () => run(file);
      }
      if (processButton) {
        if (canProcess) processButton.textContent = job ? "Retry" : file.type === "application/pdf" ? "Extract text" : "Run local OCR";
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

      let note = row.querySelector(".processing-note");
      const noteMessage = imageOcrUnavailable ? IMAGE_OCR_UNAVAILABLE_MESSAGE : scannedPdfRecovery?.message || inspection.message;
      if (noteMessage) {
        if (!note) {
          note = document.createElement("p");
          note.className = "processing-note";
          row.append(note);
        }
        note.textContent = noteMessage;
      } else note?.remove();
    });
  } finally {
    refreshing = false;
  }
}

async function analyze(file, job, row, button) {
  if (!confirm(`Send extracted text from “${file.name}” to the configured AI provider?\n\nThe original file stays on this device. AI results are suggestions only and must be reviewed.`)) return;
  button.disabled = true;
  button.textContent = "Analyzing…";
  let note = row.querySelector(".processing-note");
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

async function run(file) {
  const controller = new AbortController();
  controllers.set(file.id, controller);
  const isPdf = file.type === "application/pdf";
  await saveProcessing({
    fileId: file.id,
    caseId,
    fileHash: file.sha256,
    status: "extracting",
    message: isPdf ? "Reading selectable text locally…" : "Running OCR locally in this browser…",
    updatedAt: new Date().toISOString(),
  });
  await refresh();
  try {
    await saveProcessing(isPdf ? await processPdf(file, { signal: controller.signal }) : await processImage(file, { signal: controller.signal, runtime: imageOcrRuntime }));
  } finally {
    controllers.delete(file.id);
  }
  await refresh();
}

if (root) {
  new MutationObserver(() => queueMicrotask(refresh)).observe(root, { childList: true, subtree: true });
  refresh();
}
