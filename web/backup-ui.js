import {
  getCase,
  getEventsForCase,
  getFactsForCase,
  getFilesForCase,
  getProcessingForCase,
  getSuggestionsForCase,
  markCaseBackedUp,
} from "./storage.js";
import {
  backupLimits,
  createEncryptedCaseBackup,
  downloadEncryptedCaseBackup,
} from "./case-backup.js";

const caseId = new URLSearchParams(location.search).get("id");
const reportButton = document.querySelector(".workspace-topline > .button-secondary:not(.backup-trigger)");

if (caseId && reportButton) {
  const button = document.createElement("button");
  button.className = "button-secondary backup-trigger";
  button.type = "button";
  button.textContent = "Backup case";
  reportButton.before(button);

  const dialog = document.createElement("dialog");
  dialog.className = "backup-dialog";
  dialog.innerHTML = `<form id="backup-form"><div class="backup-head"><div><span class="section-label">LOCAL RECOVERY</span><h2>Encrypt a complete backup</h2></div><button class="dialog-close" type="button" aria-label="Close">×</button></div><p class="backup-intro">Case details, timeline events, facts, suggestions, processing results, and original record bytes will be encrypted in this browser before download.</p><div class="backup-summary" id="backup-summary"></div><label>Backup password <span>at least 12 characters</span><input id="backup-password" type="password" minlength="12" autocomplete="new-password" required></label><label>Confirm password<input id="backup-confirm" type="password" minlength="12" autocomplete="new-password" required></label><label class="backup-ack"><input id="backup-ack" type="checkbox"><span>I understand CaseFind cannot recover this password.</span></label><p class="backup-error" id="backup-error" role="status"></p><div class="backup-actions"><button class="button-secondary backup-cancel" type="button">Cancel</button><button class="button" id="create-backup" type="submit" disabled>Encrypt and download</button></div></form>`;
  document.body.append(dialog);

  const form = dialog.querySelector("form");
  const password = dialog.querySelector("#backup-password");
  const confirm = dialog.querySelector("#backup-confirm");
  const ack = dialog.querySelector("#backup-ack");
  const submit = dialog.querySelector("#create-backup");
  const error = dialog.querySelector("#backup-error");
  const summary = dialog.querySelector("#backup-summary");
  let record;
  let ready = false;
  let loadSequence = 0;

  function validate() {
    submit.disabled = !ready || password.value.length < 12 || password.value !== confirm.value || !ack.checked;
  }

  password.oninput = confirm.oninput = ack.onchange = validate;

  function close() {
    loadSequence += 1;
    ready = false;
    record = undefined;
    if (dialog.open) dialog.close();
    form.reset();
    submit.disabled = true;
    error.textContent = "";
    summary.textContent = "";
  }

  async function loadSummary(sequence) {
    try {
      const [loaded, files, facts, suggestions, events] = await Promise.all([
        getCase(caseId),
        getFilesForCase(caseId),
        getFactsForCase(caseId),
        getSuggestionsForCase(caseId),
        getEventsForCase(caseId),
      ]);
      if (sequence !== loadSequence) return;
      if (!loaded) throw new Error("This case is no longer available on this device.");

      record = loaded;
      const size = files.reduce((total, file) => total + (file.original?.size || 0), 0);
      summary.innerHTML = `<div><strong>${files.length}</strong><span>original records</span></div><div><strong>${facts.length}</strong><span>facts</span></div><div><strong>${suggestions.length}</strong><span>suggestions</span></div><div><strong>${events.length}</strong><span>timeline events</span></div><p>${(size / 1024 / 1024).toFixed(1)} MB before encryption · ${backupLimits.iterations.toLocaleString()} password-hardening rounds</p>`;
      if (size > backupLimits.maxBytes) {
        error.textContent = "This case exceeds the 50 MB in-browser backup limit. Keep the original records separately.";
        ready = false;
      } else {
        ready = true;
      }
    } catch (cause) {
      if (sequence !== loadSequence) return;
      ready = false;
      summary.textContent = "Backup details could not be loaded.";
      error.textContent = cause instanceof Error ? cause.message : "The local case could not be prepared for backup.";
    } finally {
      if (sequence === loadSequence) validate();
    }
  }

  dialog.querySelector(".dialog-close").onclick = close;
  dialog.querySelector(".backup-cancel").onclick = close;
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  button.onclick = () => {
    if (dialog.open) return;
    const sequence = ++loadSequence;
    ready = false;
    record = undefined;
    form.reset();
    submit.disabled = true;
    error.textContent = "";
    summary.textContent = "Loading local case details…";
    dialog.showModal();
    password.focus();
    void loadSummary(sequence);
  };

  function openBackupIntent() {
    if (location.hash !== "#backup") return;
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    button.click();
  }
  window.addEventListener("hashchange", openBackupIntent);
  queueMicrotask(openBackupIntent);

  form.onsubmit = async (event) => {
    event.preventDefault();
    validate();
    if (submit.disabled || !record) return;
    submit.disabled = true;
    submit.textContent = "Encrypting locally…";
    error.textContent = "";
    try {
      const [loaded, files, facts, suggestions, processing, events] = await Promise.all([
        getCase(caseId),
        getFilesForCase(caseId),
        getFactsForCase(caseId),
        getSuggestionsForCase(caseId),
        getProcessingForCase(caseId),
        getEventsForCase(caseId),
      ]);
      if (!loaded) throw new Error("This case is no longer available on this device.");
      const text = await createEncryptedCaseBackup(
        { record: loaded, files, facts, suggestions, processing, events },
        password.value,
      );
      downloadEncryptedCaseBackup(text, record.title);
      await markCaseBackedUp(caseId);
      close();
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : "The backup could not be created.";
    } finally {
      submit.textContent = "Encrypt and download";
      validate();
    }
  };
}
