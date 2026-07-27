import { getFilesForCase, getProcessingForCase, saveProcessing } from "./storage.js";
import { processPdf } from "./pdf-processing.js";

const caseId = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#file-list");
let refreshing = false;
const labels = { extracting: "Extracting…", ready_for_ai: "Text ready", needs_ocr: "OCR needed", failed: "Failed" };

async function refresh() {
  if (!caseId || !root || refreshing) return;
  refreshing = true;
  try {
    const [files, jobs] = await Promise.all([getFilesForCase(caseId), getProcessingForCase(caseId)]);
    [...root.querySelectorAll(".file-row")].forEach((row, index) => {
      const file = files[index]; if (!file) return;
      row.dataset.processingFileId = file.id;
      const actions = row.querySelector(".file-actions"); if (!actions) return;
      const job = jobs.find((item) => item.fileId === file.id);
      const status = job?.status || (file.type === "application/pdf" ? "unprocessed" : "needs_ocr");
      let badge = actions.querySelector(".processing-status");
      if (!badge) { badge = document.createElement("span"); actions.prepend(badge); }
      badge.className = `processing-status ${status}`; badge.textContent = labels[status] || "Not processed";
      let button = actions.querySelector(".process-file");
      const canProcess = file.type === "application/pdf" && (!job || job.status === "failed");
      if (canProcess && !button) {
        button = document.createElement("button"); button.type = "button"; button.className = "process-file";
        actions.insertBefore(button, badge.nextSibling); button.addEventListener("click", () => run(file));
      }
      if (button) { if (canProcess) button.textContent = job ? "Retry" : "Extract text"; else button.remove(); }
      let note = row.querySelector(".processing-note");
      if (job?.message) { if (!note) { note = document.createElement("p"); note.className = "processing-note"; row.append(note); } note.textContent = job.message; }
      else note?.remove();
    });
  } finally { refreshing = false; }
}

async function run(file) {
  await saveProcessing({ fileId: file.id, caseId, fileHash: file.sha256, status: "extracting", message: "Reading selectable text locally…", updatedAt: new Date().toISOString() });
  await refresh(); await saveProcessing(await processPdf(file)); await refresh();
}

if (root) {
  new MutationObserver(() => queueMicrotask(refresh)).observe(root, { childList: true, subtree: true });
  refresh();
}
