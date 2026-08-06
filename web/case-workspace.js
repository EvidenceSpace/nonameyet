import { confirmSuggestionAsFact, syncRenderedSuggestionSnapshots } from "./review-transition.js";
import {
  createId, deleteCase, deleteFact, deleteFile, deleteSuggestion, getCase,
  getFactsForCase, getFilesForCase, getSuggestionsForCase, saveCase, saveFact,
  saveFile, saveSuggestion, sha256,
} from "./storage.js";

const caseId = new URLSearchParams(location.search).get("id");
const workspace = document.querySelector("#workspace");
const errorView = document.querySelector("#workspace-error");
const fileInput = document.querySelector("#file-input");
const message = document.querySelector("#upload-message");
fileInput?.setAttribute("accept", "image/png,image/jpeg,image/webp,application/pdf");
const checklistItems = [
  ["agreement", "Project agreement or proposal", "Scope, price, or original terms"],
  ["price", "Agreed price and payment schedule", "Messages or documents showing the amount"],
  ["invoice", "Invoice", "The amount requested and payment details"],
  ["delivery", "Proof the work was delivered", "Email, link, or transfer confirmation"],
  ["approval", "Client approval or feedback", "Acceptance, review, or change requests"],
  ["reminders", "Payment reminders and responses", "Follow-ups and the client’s replies"],
];
const factLabels = { agreed_price: "Agreed price", payment_deadline: "Payment deadline", delivery_date: "Delivery date", client_approval: "Client approval", payment_received: "Payment received", other: "Important detail" };
let record;
let files = [];
let facts = [];
let suggestions = [];
let previewUrl;
let correctionTarget;

function escapeHtml(value = "") { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function formatBytes(bytes) { if (!bytes) return "0 bytes"; const units = ["bytes", "KB", "MB"]; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 2); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`; }
function activeSuggestions() { return suggestions.filter((item) => item.status === "suggested" || item.status === "uncertain"); }

function renderStats() {
  document.querySelector("#file-count").textContent = String(files.length);
  document.querySelector("#nav-file-count").textContent = String(files.length);
  document.querySelector("#nav-review-count").textContent = String(activeSuggestions().length);
  document.querySelector("#nav-fact-count").textContent = String(facts.length);
  document.querySelector("#file-size").textContent = formatBytes(files.reduce((sum, file) => sum + file.size, 0));
  document.querySelector("#check-progress").textContent = `${record.checklist?.length || 0}/6`;
}

function renderChecklist() {
  const root = document.querySelector("#workspace-checklist");
  root.innerHTML = checklistItems.map(([key, title, description]) => `<label class="checklist-row"><input type="checkbox" data-key="${key}" ${record.checklist?.includes(key) ? "checked" : ""}/><span class="check-box"></span><span><strong>${title}</strong><small>${description}</small></span></label>`).join("");
  root.querySelectorAll("input").forEach((input) => input.addEventListener("change", async () => {
    record.checklist = [...root.querySelectorAll("input:checked")].map((item) => item.dataset.key);
    record.updatedAt = new Date().toISOString();
    await saveCase(record);
    renderStats();
  }));
}

function renderSourceOptions() {
  const select = document.querySelector("#fact-source");
  const current = select.value;
  select.innerHTML = files.length ? files.map((file) => `<option value="${file.id}">${escapeHtml(file.name)}</option>`).join("") : '<option value="">Add a record first</option>';
  if (files.some((file) => file.id === current)) select.value = current;
}

function renderFiles() {
  const root = document.querySelector("#file-list");
  if (!files.length) {
    root.innerHTML = '<div class="empty-files">No records added yet.</div>';
    renderStats(); renderSourceOptions(); return;
  }
  root.innerHTML = files.map((file) => `<div class="file-row"><span class="file-type">${file.type === "application/pdf" ? "PDF" : "IMG"}</span><div class="file-copy"><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)} · SHA-256 ${file.sha256.slice(0, 10)}…</small></div><div class="file-actions"><span class="stored-label">Stored locally</span><button class="preview-file" data-id="${file.id}" type="button">Preview</button><button class="source-file" data-id="${file.id}" type="button">Add fact</button><button class="delete-file" data-id="${file.id}" type="button">Remove</button></div></div>`).join("");
  root.querySelectorAll(".preview-file").forEach((button) => button.addEventListener("click", () => previewFile(button.dataset.id)));
  root.querySelectorAll(".source-file").forEach((button) => button.addEventListener("click", () => openFactDialog(button.dataset.id)));
  root.querySelectorAll(".delete-file").forEach((button) => button.addEventListener("click", async () => {
    const linked = facts.some((fact) => fact.sourceFileId === button.dataset.id) || suggestions.some((suggestion) => suggestion.fileId === button.dataset.id);
    if (linked) { message.className = "upload-message error"; message.textContent = "Resolve or remove linked facts and suggestions before deleting this source record."; return; }
    const file = files.find((item) => item.id === button.dataset.id);
    try {
      await deleteFile(button.dataset.id); files = files.filter((item) => item.id !== button.dataset.id); renderFiles();
    } catch {
      message.className = "upload-message error";
      message.textContent = `${file?.name || "This record"} could not be removed from this device. Nothing was changed. Try again.`;
    }
  }));
  renderStats(); renderSourceOptions();
}

function renderFacts() {
  const root = document.querySelector("#fact-record-list");
  if (!facts.length) { root.innerHTML = '<div class="empty-facts">No confirmed facts yet.</div>'; renderStats(); return; }
  root.innerHTML = facts.map((fact) => {
    const file = files.find((item) => item.id === fact.sourceFileId);
    const label = fact.label || factLabels[fact.type] || factLabels.other;
    const decisionBadge = fact.aiSuggested ? `<span class="${fact.status === "corrected" ? "corrected-badge" : "manual-badge"}">${fact.status === "corrected" ? "User-corrected" : "User-confirmed"}</span><span class="ai-badge">AI-assisted</span>` : '<span class="manual-badge">User-entered</span>';
    return `<div class="fact-record"><span class="fact-record-icon">✓</span><div class="fact-record-copy"><strong>${escapeHtml(label)}</strong><p>${escapeHtml(fact.value)}</p>${fact.note ? `<small>${escapeHtml(fact.note)}</small>` : ""}<div class="fact-record-badges">${decisionBadge}<span class="source-badge">Source: ${escapeHtml(file?.name || "Missing record")}</span></div></div><button class="delete-fact" data-id="${fact.id}" type="button">Remove</button></div>`;
  }).join("");
  root.querySelectorAll(".delete-fact").forEach((button) => button.addEventListener("click", async () => { await deleteFact(button.dataset.id); facts = facts.filter((fact) => fact.id !== button.dataset.id); renderFacts(); }));
  renderStats();
}

function confidenceText(value) { return value >= 0.8 ? "Strong text match" : value >= 0.5 ? "Text match found" : "Check carefully"; }

function renderSuggestions() {
  const root = document.querySelector("#suggestion-list");
  const active = activeSuggestions();
  syncRenderedSuggestionSnapshots(active);
  const signals = active.flatMap((item) => item.injectionSignals || []);
  const warning = document.querySelector("#review-warning");
  warning.hidden = signals.length === 0;
  document.querySelector("#review-warning-copy").textContent = signals.length ? ` ${signals.length} instruction-like passage${signals.length === 1 ? " was" : "s were"} treated as document content, not commands.` : "";
  if (!active.length) {
    root.innerHTML = '<div class="empty-suggestions"><strong>No suggestions need review.</strong>AI-generated details will appear here only after they pass source-quote checks.</div>';
    renderStats(); return;
  }
  root.innerHTML = active.map((suggestion) => {
    const file = files.find((item) => item.id === suggestion.fileId);
    const quote = suggestion.sourceReference?.locator?.quote || suggestion.quote || "Source quote unavailable";
    const uncertain = suggestion.status === "uncertain";
    return `<article class="suggestion-card ${uncertain ? "uncertain" : ""}" data-id="${suggestion.id}"><div class="suggestion-head"><span class="suggestion-kind"><i></i> AI suggestion</span><span class="${uncertain ? "uncertain-badge" : "grounded-badge"}">${uncertain ? "Needs more context" : confidenceText(suggestion.confidence)}</span></div><h4>${escapeHtml(suggestion.label)}</h4><p class="suggestion-value">${escapeHtml(suggestion.value)}</p><blockquote class="source-quote">${escapeHtml(quote)}</blockquote><p class="suggestion-source">From ${escapeHtml(file?.name || "Missing record")}</p><div class="suggestion-actions"><button class="source-suggestion" type="button">View source</button><button class="confirm-suggestion" type="button">Confirm</button><button class="correct-suggestion" type="button">Correct</button><button class="uncertain-suggestion" type="button">Not sure</button><button class="dismiss-suggestion" type="button">Dismiss</button></div></article>`;
  }).join("");
  root.querySelectorAll(".suggestion-card").forEach((card) => {
    const suggestion = suggestions.find((item) => item.id === card.dataset.id);
    card.querySelector(".source-suggestion").addEventListener("click", () => previewFile(suggestion.fileId, suggestion.sourceReference?.locator?.quote || suggestion.quote));
    card.querySelector(".confirm-suggestion").addEventListener("click", () => acceptSuggestion(suggestion, suggestion.value, "confirmed"));
    card.querySelector(".correct-suggestion").addEventListener("click", () => openCorrection(suggestion));
    card.querySelector(".uncertain-suggestion").addEventListener("click", async () => { suggestion.status = "uncertain"; suggestion.updatedAt = new Date().toISOString(); await saveSuggestion(suggestion); renderSuggestions(); });
    card.querySelector(".dismiss-suggestion").addEventListener("click", async () => { await deleteSuggestion(suggestion.id); suggestions = suggestions.filter((item) => item.id !== suggestion.id); renderSuggestions(); });
  });
  renderStats();
}

async function acceptSuggestion(suggestion, value, status) {
  const fact = {
    id: createId("fact"), caseId, label: suggestion.label, type: "other", value,
    sourceFileId: suggestion.fileId, sourceReference: suggestion.sourceReference,
    status, manuallyEntered: false, aiSuggested: true, decidedByUser: true,
    createdAt: new Date().toISOString(),
  };
  await confirmSuggestionAsFact(fact, suggestion);
  facts.push(fact);
  suggestions = suggestions.filter((item) => item.id !== suggestion.id);
  renderSuggestions(); renderFacts();
}

async function addFiles(selected) {
  message.className = "upload-message"; message.textContent = "";
  for (const file of selected) {
    if (!["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(file.type)) { message.className = "upload-message error"; message.textContent = `${file.name} was skipped: unsupported type.`; continue; }
    if (file.size > 20 * 1024 * 1024) { message.className = "upload-message error"; message.textContent = `${file.name} exceeds 20 MB.`; continue; }
    if (files.length >= 100) { message.className = "upload-message error"; message.textContent = "This preview supports up to 100 files per case."; break; }
    try {
      const hash = await sha256(file);
      if (files.some((item) => item.sha256 === hash)) { message.className = "upload-message error"; message.textContent = `${file.name} is already in this case.`; continue; }
      const stored = { id: createId("file"), caseId, name: file.name, type: file.type, size: file.size, sha256: hash, createdAt: new Date().toISOString(), original: file };
      await saveFile(stored); files.push(stored); message.textContent = `Stored ${file.name} locally.`;
    } catch {
      message.className = "upload-message error";
      message.textContent = `${file.name} could not be stored on this device. Check available browser storage and try again.`;
    }
  }
  fileInput.value = ""; renderFiles();
}

const previewDialog = document.querySelector("#preview-dialog");
function previewFile(id, quote) {
  const file = files.find((item) => item.id === id); if (!file) return;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file.original);
  document.querySelector("#preview-title").textContent = file.name;
  document.querySelector("#preview-type").textContent = file.type;
  document.querySelector("#preview-size").textContent = formatBytes(file.size);
  document.querySelector("#preview-hash").textContent = file.sha256;
  document.querySelector("#record-preview").innerHTML = file.type === "application/pdf" ? `<embed src="${previewUrl}" type="application/pdf" />` : file.type === "image/heic" ? '<div class="preview-unavailable">HEIC preview unavailable. Original remains stored.</div>' : `<img src="${previewUrl}" alt="Preview of ${escapeHtml(file.name)}" />`;
  const excerpt = document.querySelector("#source-excerpt"); excerpt.hidden = !quote; document.querySelector("#source-quote").textContent = quote || "";
  previewDialog.showModal();
}
function closePreview() { previewDialog.close(); if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = undefined; } document.querySelector("#record-preview").innerHTML = ""; }
document.querySelector("#close-preview").addEventListener("click", closePreview);

const factDialog = document.querySelector("#fact-dialog");
const factForm = document.querySelector("#fact-form");
function openFactDialog(fileId) { if (!files.length) { message.className = "upload-message error"; message.textContent = "Add a record first."; return; } factForm.reset(); renderSourceOptions(); if (fileId) document.querySelector("#fact-source").value = fileId; factDialog.showModal(); }
document.querySelector("#add-fact").addEventListener("click", () => openFactDialog());
document.querySelector("#close-fact").addEventListener("click", () => factDialog.close());
document.querySelector("#cancel-fact").addEventListener("click", () => factDialog.close());
factForm.addEventListener("submit", async (event) => { event.preventDefault(); const sourceFileId = document.querySelector("#fact-source").value; const file = files.find((item) => item.id === sourceFileId); if (!file) return; const fact = { id: createId("fact"), caseId, type: document.querySelector("#fact-type").value, value: document.querySelector("#fact-value").value.trim(), note: document.querySelector("#fact-note").value.trim(), sourceFileId, sourceReference: { fileId: sourceFileId, sha256: file.sha256, locator: { kind: "whole_file" } }, status: "confirmed", manuallyEntered: true, createdAt: new Date().toISOString() }; await saveFact(fact); facts.push(fact); factDialog.close(); renderFacts(); });

const correctionDialog = document.querySelector("#correction-dialog");
function openCorrection(suggestion) { correctionTarget = suggestion; document.querySelector("#correction-original").textContent = suggestion.value; document.querySelector("#correction-quote").textContent = `“${suggestion.sourceReference?.locator?.quote || suggestion.quote || ""}”`; document.querySelector("#correction-value").value = suggestion.value; correctionDialog.showModal(); document.querySelector("#correction-value").select(); }
document.querySelector("#close-correction").addEventListener("click", () => correctionDialog.close());
document.querySelector("#cancel-correction").addEventListener("click", () => correctionDialog.close());
document.querySelector("#correction-form").addEventListener("submit", async (event) => { event.preventDefault(); const value = document.querySelector("#correction-value").value.trim(); if (!value || !correctionTarget) return; correctionDialog.close(); await acceptSuggestion(correctionTarget, value, "corrected"); correctionTarget = undefined; });

async function init() {
  if (!caseId) { errorView.hidden = false; return; }
  record = await getCase(caseId);
  if (!record) { errorView.hidden = false; return; }
  [files, facts, suggestions] = await Promise.all([getFilesForCase(caseId), getFactsForCase(caseId), getSuggestionsForCase(caseId)]);
  document.querySelector("#sidebar-title").textContent = record.title;
  document.querySelector("#workspace-title").textContent = record.title;
  document.querySelector("#workspace-summary").textContent = record.summary;
  document.querySelector("#workspace-amount").textContent = record.amount ? `₹${record.amount}` : "Not entered";
  document.title = `${record.title} — CaseFind`;
  renderChecklist(); renderFiles(); renderSuggestions(); renderFacts(); workspace.hidden = false;
}

fileInput.addEventListener("change", () => addFiles([...fileInput.files]));
const dropzone = document.querySelector("#dropzone");
["dragenter", "dragover"].forEach((type) => dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.add("dragging"); }));
["dragleave", "drop"].forEach((type) => dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.remove("dragging"); }));
dropzone.addEventListener("drop", (event) => addFiles([...event.dataTransfer.files]));
const deleteDialog = document.querySelector("#delete-dialog");
document.querySelector("#delete-case").addEventListener("click", () => deleteDialog.showModal());
document.querySelector("#confirm-delete").addEventListener("click", async (event) => { event.preventDefault(); await deleteCase(caseId); location.href = "index.html"; });
init().catch((error) => { console.error(error); errorView.hidden = false; });
