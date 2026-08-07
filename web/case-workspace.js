import { confirmSuggestionAsFact, syncRenderedFactSnapshots, syncRenderedSuggestionSnapshots } from "./review-transition.js";
import {
  createId, deleteCase, deleteFile, deleteSuggestion, FileRemovalError, getCase,
  getFactsForCase, getFilesForCase, getSuggestionsForCase, saveCase, saveFact,
  saveFile, saveSuggestion, sha256, validFileRemovalSnapshot,
} from "./storage.js";

const params = new URLSearchParams(location.search);
const caseId = params.get("id");
const workspace = document.querySelector("#workspace");
const errorState = document.querySelector("#workspace-error");
const fileInput = document.querySelector("#file-input");
const message = document.querySelector("#upload-message");
const checklistRoot = document.querySelector("#workspace-checklist");
const factSource = document.querySelector("#fact-source");
let files = [];
let facts = [];
let suggestions = [];
let suggestionSourceFileId = null;
let activeFileId = null;
const renderedFileSnapshots = new Map();
const activeFileRemovals = new Set();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
}
function fileSize(bytes) {
  if (!bytes) return "0 KB";
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}
function dateLabel(value) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "Not available" : parsed.toLocaleString();
}
function typeLabel(type) {
  if (type === "application/pdf") return "PDF";
  if (type?.startsWith("image/")) return "IMG";
  if (type === "text/plain") return "TXT";
  return "FILE";
}
function typeClass(type) {
  if (type === "application/pdf") return "pdf";
  if (type?.startsWith("image/")) return "img";
  if (type === "text/plain") return "txt";
  return "file";
}
function syncRenderedFileSnapshots(currentFiles = []) {
  renderedFileSnapshots.clear();
  for (const file of currentFiles) {
    if (!validFileRemovalSnapshot(file)) continue;
    renderedFileSnapshots.set(file.id, structuredClone(file));
  }
}
function requireRenderedFile(fileId) {
  const file = renderedFileSnapshots.get(fileId);
  if (!file || !validFileRemovalSnapshot(file)) throw new FileRemovalError("stale_file");
  return structuredClone(file);
}
function setFileRowBusy(fileId, busy) {
  const row = [...document.querySelectorAll(".file-row")].find((candidate) => candidate.dataset.id === fileId);
  if (!row) return;
  if (busy) row.setAttribute("aria-busy", "true");
  else row.removeAttribute("aria-busy");
  row.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
}
function fileRemovalFailureText(error, file) {
  if (error instanceof FileRemovalError) {
    if (["stale_file", "file_linked", "case_missing"].includes(error.code)) return error.message;
  }
  return `${file.name} could not be removed from this device. Nothing was changed. Try again.`;
}
async function removeRenderedFile(fileId) {
  if (activeFileRemovals.has(fileId)) return;
  let file;
  try {
    file = requireRenderedFile(fileId);
  } catch (error) {
    message.textContent = error.message;
    message.className = "upload-message error";
    return;
  }
  activeFileRemovals.add(fileId);
  setFileRowBusy(fileId, true);
  message.textContent = `Removing ${file.name} from this device…`;
  message.className = "upload-message";
  try {
    await deleteFile(file);
    location.reload();
  } catch (error) {
    message.textContent = fileRemovalFailureText(error, file);
    message.className = "upload-message error";
    activeFileRemovals.delete(fileId);
    setFileRowBusy(fileId, false);
  }
}
function renderFiles() {
  const root = document.querySelector("#file-list");
  document.querySelector("#file-count").textContent = String(files.length);
  document.querySelector("#nav-file-count").textContent = String(files.length);
  document.querySelector("#file-size").textContent = fileSize(files.reduce((sum, file) => sum + file.size, 0));
  factSource.innerHTML = files.map((file) => `<option value="${escapeHtml(file.id)}">${escapeHtml(file.name)}</option>`).join("");
  if (!files.length) {
    syncRenderedFileSnapshots();
    root.innerHTML = '<div class="empty-state"><strong>No files yet.</strong> Add PDFs, images, or text documents to begin.</div>';
    return;
  }
  syncRenderedFileSnapshots(files);
  root.innerHTML = files.map((file) => `<article class="file-row" data-id="${escapeHtml(file.id)}"><div class="file-icon ${typeClass(file.type)}">${typeLabel(file.type)}</div><div class="file-copy"><strong>${escapeHtml(file.name)}</strong><span>${typeLabel(file.type)} · ${fileSize(file.size)}</span></div><div class="file-actions"><button type="button" class="source-file" data-id="${escapeHtml(file.id)}">Use as source</button><button type="button" class="preview-file" data-id="${escapeHtml(file.id)}">Preview</button><button type="button" class="delete-file" data-id="${escapeHtml(file.id)}" aria-label="Remove ${escapeHtml(file.name)}">×</button></div></article>`).join("");
}
function renderFacts() {
  const root = document.querySelector("#fact-record-list");
  document.querySelector("#nav-fact-count").textContent = String(facts.length);
  syncRenderedFactSnapshots(facts);
  if (!facts.length) {
    root.innerHTML = '<div class="empty-state"><strong>No confirmed facts yet.</strong> Add one manually or confirm a suggestion after reviewing its source.</div>';
    return;
  }
  root.innerHTML = facts.map((fact) => {
    const source = files.find((file) => file.id === fact.sourceFileId)?.name;
    return `<article class="fact-record"><div class="fact-record-copy"><strong>${escapeHtml(fact.type === "date" ? "Date" : fact.type === "amount" ? "Amount" : "Fact")}</strong><span>${escapeHtml(fact.value)}</span>${source ? `<small>Source: ${escapeHtml(source)}</small>` : ""}${fact.note ? `<small>${escapeHtml(fact.note)}</small>` : ""}</div><button type="button" class="delete-fact" data-id="${escapeHtml(fact.id)}" aria-label="Delete fact">×</button></article>`;
  }).join("");
}
function renderSuggestions() {
  const root = document.querySelector("#suggestion-list");
  document.querySelector("#nav-review-count").textContent = String(suggestions.length);
  syncRenderedSuggestionSnapshots(suggestions);
  const warning = document.querySelector("#review-warning");
  const copy = document.querySelector("#review-warning-copy");
  const uncertainCount = suggestions.filter((suggestion) => suggestion.uncertain).length;
  warning.hidden = suggestions.length === 0;
  copy.textContent = uncertainCount
    ? `${uncertainCount} suggestion${uncertainCount === 1 ? "" : "s"} marked uncertain. Confirm only after checking the source.`
    : "Suggestions are drafts only. Compare each one with the source before confirming.";
  if (!suggestions.length) {
    root.innerHTML = '<div class="empty-suggestions"><strong>No suggestions waiting.</strong> Suggestions will appear only after you explicitly choose a local source for review.</div>';
    return;
  }
  root.innerHTML = suggestions.map((suggestion) => {
    const source = files.find((file) => file.id === suggestion.fileId)?.name || "Local source";
    return `<article class="suggestion-card${suggestion.uncertain ? " uncertain" : ""}" data-id="${escapeHtml(suggestion.id)}"><div class="suggestion-head"><span class="suggestion-kind"><i></i>${escapeHtml(suggestion.type)}</span><span class="${suggestion.uncertain ? "uncertain-badge" : "grounded-badge"}">${suggestion.uncertain ? "Needs attention" : "Source linked"}</span></div><h4>Suggested value</h4><p class="suggestion-value">${escapeHtml(suggestion.value)}</p>${suggestion.quote ? `<blockquote class="source-quote">${escapeHtml(suggestion.quote)}</blockquote>` : ""}<p class="suggestion-source">${escapeHtml(source)} · Extracted text only · Review required</p><div class="suggestion-actions"><button type="button" class="source-suggestion" data-id="${escapeHtml(suggestion.id)}">View source</button><button type="button" class="confirm-suggestion" data-id="${escapeHtml(suggestion.id)}">Confirm</button><button type="button" class="correct-suggestion" data-id="${escapeHtml(suggestion.id)}">Correct</button><button type="button" class="uncertain-suggestion" data-id="${escapeHtml(suggestion.id)}">Not sure</button><button type="button" class="dismiss-suggestion" data-id="${escapeHtml(suggestion.id)}">Dismiss</button></div></article>`;
  }).join("");
}
function renderChecklist(record) {
  const checklist = Array.isArray(record.checklist) ? record.checklist : [];
  const done = checklist.filter((item) => item.done).length;
  document.querySelector("#check-progress").textContent = `${done} / ${checklist.length}`;
  checklistRoot.innerHTML = checklist.map((item) => `<label class="check-item"><input type="checkbox" data-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""}><span>${escapeHtml(item.label)}</span></label>`).join("");
}
async function init() {
  if (!caseId) { workspace.hidden = true; errorState.hidden = false; return; }
  const record = await getCase(caseId);
  if (!record) { workspace.hidden = true; errorState.hidden = false; return; }
  document.querySelector("#sidebar-title").textContent = record.title;
  document.querySelector("#workspace-title").textContent = record.title;
  document.querySelector("#workspace-summary").textContent = record.summary || "No summary provided.";
  document.querySelector("#workspace-amount").textContent = record.amount ? `Disputed amount: ${record.amount}` : "No disputed amount entered.";
  renderChecklist(record);
  [files, facts, suggestions] = await Promise.all([
    getFilesForCase(caseId), getFactsForCase(caseId), getSuggestionsForCase(caseId),
  ]);
  files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  facts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  suggestions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  renderFiles(); renderFacts(); renderSuggestions();
  workspace.hidden = false;
}

fileInput.addEventListener("change", async () => {
  const selected = [...fileInput.files];
  if (!selected.length) return;
  if (files.length + selected.length > 100) {
    message.textContent = "This case can store up to 100 files in this preview.";
    message.className = "upload-message error";
    fileInput.value = "";
    return;
  }
  message.textContent = "Checking files before saving locally…";
  message.className = "upload-message";
  let added = 0;
  const problems = [];
  for (const file of selected) {
    if (file.size > 25 * 1024 * 1024) { problems.push(`${file.name} is larger than 25 MB.`); continue; }
    const hash = await sha256(file);
    if (files.some((item) => item.sha256 === hash)) { problems.push(`${file.name} is already in this case.`); continue; }
    try {
      const stored = { id: createId("file"), caseId, name: file.name, type: file.type || "application/octet-stream", size: file.size, sha256: hash, original: file, createdAt: new Date().toISOString() };
      await saveFile(stored);
      files.unshift(stored);
      added += 1;
    } catch (error) {
      problems.push(error?.name === "ConstraintError" ? `${file.name} is already in this case.` : `${file.name} could not be saved.`);
    }
  }
  renderFiles();
  message.textContent = [added ? `${added} file${added === 1 ? "" : "s"} saved locally.` : "", ...problems].filter(Boolean).join(" ");
  message.className = problems.length ? "upload-message error" : "upload-message";
  fileInput.value = "";
});

document.querySelector("#file-list").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const fileId = button.dataset.id;
  if (button.classList.contains("delete-file")) {
    void removeRenderedFile(fileId);
    return;
  }
  if (button.classList.contains("source-file")) {
    factSource.value = fileId;
    document.querySelector("#fact-dialog").showModal();
    return;
  }
  if (button.classList.contains("preview-file")) {
    const file = files.find((item) => item.id === fileId);
    if (!file) return;
    activeFileId = fileId;
    document.querySelector("#preview-title").textContent = file.name;
    document.querySelector("#preview-type").textContent = typeLabel(file.type);
    document.querySelector("#preview-size").textContent = fileSize(file.size);
    document.querySelector("#preview-hash").textContent = file.sha256;
    const preview = document.querySelector("#record-preview");
    preview.replaceChildren();
    if (file.type?.startsWith("image/")) {
      const image = new Image();
      image.alt = `Preview of ${file.name}`;
      image.src = URL.createObjectURL(file.original);
      image.addEventListener("load", () => URL.revokeObjectURL(image.src), { once: true });
      preview.append(image);
    } else preview.textContent = "The original is preserved locally. Preview rendering for this type will be added in a later processing milestone.";
    document.querySelector("#source-excerpt").hidden = true;
    document.querySelector("#preview-dialog").showModal();
  }
});

document.querySelector("#suggestion-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const suggestion = suggestions.find((item) => item.id === button.dataset.id);
  if (!suggestion) return;
  if (button.classList.contains("confirm-suggestion")) {
    const fact = { id: createId("fact"), caseId, type: suggestion.type, value: suggestion.value, sourceFileId: suggestion.fileId, sourceReference: suggestion.sourceReference, sourceQuote: suggestion.quote || null, status: "confirmed", createdAt: new Date().toISOString(), confirmedAt: new Date().toISOString(), manuallyEntered: false };
    if (!await confirmSuggestionAsFact(fact, suggestion)) return;
    location.reload();
  }
  if (button.classList.contains("correct-suggestion")) {
    suggestionSourceFileId = suggestion.id;
    document.querySelector("#correction-original").textContent = suggestion.value;
    document.querySelector("#correction-quote").textContent = suggestion.quote ? `“${suggestion.quote}”` : "No source quote stored.";
    document.querySelector("#correction-value").value = suggestion.value;
    document.querySelector("#correction-dialog").showModal();
  }
  if (button.classList.contains("uncertain-suggestion")) {
    suggestion.uncertain = true;
    suggestion.updatedAt = new Date().toISOString();
    await saveSuggestion(suggestion);
    renderSuggestions();
  }
  if (button.classList.contains("dismiss-suggestion")) {
    await deleteSuggestion(suggestion.id);
    suggestions = suggestions.filter((item) => item.id !== suggestion.id);
    renderSuggestions();
  }
  if (button.classList.contains("source-suggestion")) {
    const file = files.find((item) => item.id === suggestion.fileId);
    if (!file) return;
    document.querySelector(`.preview-file[data-id="${CSS.escape(file.id)}"]`)?.click();
    const sourceExcerpt = document.querySelector("#source-excerpt");
    sourceExcerpt.hidden = !suggestion.quote;
    document.querySelector("#source-quote").textContent = suggestion.quote || "";
  }
});

document.querySelector("#correction-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const suggestion = suggestions.find((item) => item.id === suggestionSourceFileId);
  const corrected = document.querySelector("#correction-value").value.trim();
  if (!suggestion || !corrected) return;
  const fact = { id: createId("fact"), caseId, type: suggestion.type, value: corrected, sourceFileId: suggestion.fileId, sourceReference: suggestion.sourceReference, sourceQuote: suggestion.quote || null, status: "confirmed", createdAt: new Date().toISOString(), confirmedAt: new Date().toISOString(), manuallyEntered: false, correctedFrom: suggestion.value };
  if (!await confirmSuggestionAsFact(fact, suggestion)) return;
  document.querySelector("#correction-dialog").close();
  location.reload();
});

document.querySelector("#fact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = document.querySelector("#fact-value").value.trim();
  if (!value) return;
  const sourceFileId = factSource.value || null;
  const sourceFile = files.find((file) => file.id === sourceFileId);
  await saveFact({ id: createId("fact"), caseId, type: document.querySelector("#fact-type").value, value, note: document.querySelector("#fact-note").value.trim(), sourceFileId, sourceReference: sourceFile ? { fileId: sourceFile.id, sha256: sourceFile.sha256, locator: { kind: "whole_file" } } : null, status: "confirmed", manuallyEntered: true, createdAt: new Date().toISOString() });
  document.querySelector("#fact-dialog").close();
  location.reload();
});

checklistRoot.addEventListener("change", async (event) => {
  const input = event.target.closest("input[type='checkbox']");
  if (!input) return;
  const record = await getCase(caseId);
  record.checklist = (record.checklist || []).map((item) => item.id === input.dataset.id ? { ...item, done: input.checked } : item);
  record.updatedAt = new Date().toISOString();
  await saveCase(record);
  renderChecklist(record);
});

document.querySelector("#add-fact").addEventListener("click", () => document.querySelector("#fact-dialog").showModal());
document.querySelector("#close-fact").addEventListener("click", () => document.querySelector("#fact-dialog").close());
document.querySelector("#cancel-fact").addEventListener("click", () => document.querySelector("#fact-dialog").close());
document.querySelector("#close-correction").addEventListener("click", () => document.querySelector("#correction-dialog").close());
document.querySelector("#cancel-correction").addEventListener("click", () => document.querySelector("#correction-dialog").close());
document.querySelector("#close-preview").addEventListener("click", () => document.querySelector("#preview-dialog").close());
document.querySelector("#delete-case").addEventListener("click", () => document.querySelector("#delete-dialog").showModal());
document.querySelector("#confirm-delete").addEventListener("click", async () => { await deleteCase(caseId); location.href = "cases.html"; });
document.querySelector("#dropzone").addEventListener("dragover", (event) => { event.preventDefault(); event.currentTarget.classList.add("dragging"); });
document.querySelector("#dropzone").addEventListener("dragleave", (event) => event.currentTarget.classList.remove("dragging"));
document.querySelector("#dropzone").addEventListener("drop", (event) => { event.preventDefault(); event.currentTarget.classList.remove("dragging"); fileInput.files = event.dataTransfer.files; fileInput.dispatchEvent(new Event("change")); });

init().catch(() => { workspace.hidden = true; errorState.hidden = false; });
