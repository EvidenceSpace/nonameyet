import { getFilesForCase, getProcessingForCase, saveProcessing } from "./storage.js";
import { processPdf } from "./pdf-processing.js";

const caseId = new URLSearchParams(location.search).get("id");
const root = document.querySelector("#file-list");
let refreshing = false;
const labels = { extracting: "Extracting…", ready_for_ai: "Text ready", needs_ocr: "OCR needed", failed: "Failed" };

const viewer = document.createElement("dialog");
viewer.className = "text-source-dialog";
viewer.innerHTML = `<div class="text-source-head"><div><span class="section-label">EXTRACTED SOURCE TEXT</span><h2 id="text-source-title"></h2></div><button class="dialog-close" id="close-text-source" type="button" aria-label="Close">×</button></div><div class="text-source-trust">Local extraction only · Review the original record before confirming any fact.</div><div class="text-source-meta"><span id="text-source-page"></span><span id="text-source-adapter"></span></div><pre id="text-source-content"></pre><div class="text-source-footer"><code id="text-source-hash"></code><div><button class="button-secondary" id="previous-text-page" type="button">Previous</button><button class="button-secondary" id="next-text-page" type="button">Next</button></div></div>`;
document.body.append(viewer);
viewer.querySelector("#close-text-source").addEventListener("click", () => viewer.close());
let viewedPages = [], viewedIndex = 0;
function renderViewedPage() {
  const page = viewedPages[viewedIndex];
  viewer.querySelector("#text-source-page").textContent = `Page ${page.pageNumber} of ${viewedPages.length}`;
  viewer.querySelector("#text-source-content").textContent = page.text || "No selectable text on this page.";
  viewer.querySelector("#previous-text-page").disabled = viewedIndex === 0;
  viewer.querySelector("#next-text-page").disabled = viewedIndex === viewedPages.length - 1;
}
viewer.querySelector("#previous-text-page").addEventListener("click", () => { if (viewedIndex > 0) { viewedIndex -= 1; renderViewedPage(); } });
viewer.querySelector("#next-text-page").addEventListener("click", () => { if (viewedIndex < viewedPages.length - 1) { viewedIndex += 1; renderViewedPage(); } });
function openTextSource(file, job) {
  viewedPages = job.artifact?.pages || []; if (!viewedPages.length) return; viewedIndex = 0;
  viewer.querySelector("#text-source-title").textContent = file.name;
  viewer.querySelector("#text-source-adapter").textContent = job.artifact.adapterVersion;
  viewer.querySelector("#text-source-hash").textContent = `SHA-256 ${job.fileHash}`;
  renderViewedPage(); viewer.showModal();
}

async function refresh() {
  if (!caseId || !root || refreshing) return; refreshing = true;
  try {
    const [files, jobs] = await Promise.all([getFilesForCase(caseId), getProcessingForCase(caseId)]);
    [...root.querySelectorAll(".file-row")].forEach((row, index) => {
      const file = files[index]; if (!file) return;
      const actions = row.querySelector(".file-actions"); if (!actions) return;
      const job = jobs.find((item) => item.fileId === file.id);
      const status = job?.status || (file.type === "application/pdf" ? "unprocessed" : "needs_ocr");
      let badge = actions.querySelector(".processing-status"); if (!badge) { badge = document.createElement("span"); actions.prepend(badge); }
      badge.className = `processing-status ${status}`; badge.textContent = labels[status] || "Not processed";
      let processButton = actions.querySelector(".process-file");
      const canProcess = file.type === "application/pdf" && (!job || job.status === "failed");
      if (canProcess && !processButton) { processButton = document.createElement("button"); processButton.type="button"; processButton.className="process-file"; actions.insertBefore(processButton,badge.nextSibling); processButton.addEventListener("click",()=>run(file)); }
      if (processButton) { if (canProcess) processButton.textContent = job ? "Retry" : "Extract text"; else processButton.remove(); }
      let viewButton = actions.querySelector(".view-extracted-text");
      if (job?.status === "ready_for_ai" && job.artifact?.pages?.length) {
        if (!viewButton) { viewButton=document.createElement("button"); viewButton.type="button"; viewButton.className="view-extracted-text"; actions.insertBefore(viewButton,actions.querySelector(".preview-file")); }
        viewButton.textContent="View text"; viewButton.onclick=()=>openTextSource(file,job);
      } else viewButton?.remove();
      let note=row.querySelector(".processing-note"); if(job?.message){if(!note){note=document.createElement("p");note.className="processing-note";row.append(note)}note.textContent=job.message}else note?.remove();
    });
  } finally { refreshing=false; }
}
async function run(file){await saveProcessing({fileId:file.id,caseId,fileHash:file.sha256,status:"extracting",message:"Reading selectable text locally…",updatedAt:new Date().toISOString()});await refresh();await saveProcessing(await processPdf(file));await refresh();}
if(root){new MutationObserver(()=>queueMicrotask(refresh)).observe(root,{childList:true,subtree:true});refresh();}
