import { createId, deleteFact, deleteSuggestion, getSuggestionsForCase, openDatabase, saveSuggestion } from "./storage.js";

export async function confirmSuggestionAsFact(fact, suggestionId) {
  if (!fact?.id || !fact.caseId || !fact.sourceFileId || !suggestionId) throw new Error("Invalid review transition.");
  const db = await openDatabase();
  let transitionError;
  try {
    const tx = db.transaction(["facts", "suggestions", "cases"], "readwrite");
    const suggestions = tx.objectStore("suggestions");
    const suggestionRequest = suggestions.get(suggestionId);
    suggestionRequest.onsuccess = () => {
      const suggestion = suggestionRequest.result;
      if (!suggestion || suggestion.caseId !== fact.caseId || suggestion.fileId !== fact.sourceFileId) {
        transitionError = new Error("The reviewed suggestion no longer matches this fact.");
        tx.abort();
        return;
      }
      tx.objectStore("facts").add(fact);
      suggestions.delete(suggestionId);
      const cases = tx.objectStore("cases");
      const caseRequest = cases.get(fact.caseId);
      caseRequest.onsuccess = () => {
        if (caseRequest.result) cases.put({ ...caseRequest.result, updatedAt: new Date().toISOString() });
      };
    };
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(transitionError || tx.error || suggestionRequest.error || new Error("Review transaction aborted"));
    });
  } finally { db.close(); }
}

function buildFact(caseId, suggestion, value, status) {
  return {
    id: createId("fact"), caseId, label: suggestion.label, type: "other", value,
    sourceFileId: suggestion.fileId, sourceReference: suggestion.sourceReference,
    status, manuallyEntered: false, aiSuggested: true, decidedByUser: true,
    createdAt: new Date().toISOString(),
  };
}
function showFailure(text) {
  const message = document.querySelector("#upload-message");
  message.className = "upload-message error";
  message.textContent = text;
}
async function findSuggestion(caseId, suggestionId) {
  return (await getSuggestionsForCase(caseId)).find((item) => item.id === suggestionId);
}

if (location.pathname.endsWith("/case.html")) {
  document.addEventListener("click", async (event) => {
    const correctButton = event.target.closest?.(".correct-suggestion");
    if (correctButton) {
      document.querySelector("#correction-dialog").dataset.suggestionId = correctButton.closest(".suggestion-card")?.dataset.id || "";
      return;
    }
    const dismissButton = event.target.closest?.(".dismiss-suggestion");
    if (dismissButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const suggestionId = dismissButton.closest(".suggestion-card")?.dataset.id;
      try {
        await deleteSuggestion(suggestionId);
        location.reload();
      } catch {
        showFailure("The suggestion could not be dismissed on this device. Nothing was changed. Try again.");
      }
      return;
    }
    const uncertainButton = event.target.closest?.(".uncertain-suggestion");
    if (uncertainButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const caseId = new URLSearchParams(location.search).get("id");
      const suggestion = await findSuggestion(caseId, uncertainButton.closest(".suggestion-card")?.dataset.id);
      if (!suggestion) { showFailure("The suggestion is no longer available. Reload and try again."); return; }
      try {
        await saveSuggestion({ ...suggestion, status: "uncertain", updatedAt: new Date().toISOString() });
        location.reload();
      } catch {
        showFailure("The review status could not be changed on this device. Nothing was changed. Try again.");
      }
      return;
    }
    const deleteFactButton = event.target.closest?.(".delete-fact");
    if (deleteFactButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await deleteFact(deleteFactButton.dataset.id);
        location.reload();
      } catch {
        showFailure("The fact could not be removed from this device. Nothing was changed. Try again.");
      }
      return;
    }
    const button = event.target.closest?.(".confirm-suggestion");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const caseId = new URLSearchParams(location.search).get("id");
    const suggestion = await findSuggestion(caseId, button.closest(".suggestion-card")?.dataset.id);
    if (!suggestion) { showFailure("The suggestion is no longer available. Reload and try again."); return; }
    try {
      await confirmSuggestionAsFact(buildFact(caseId, suggestion, suggestion.value, "confirmed"), suggestion.id);
      location.reload();
    } catch {
      showFailure("The suggestion could not be confirmed on this device. Nothing was changed. Try again.");
    }
  }, true);

  document.addEventListener("submit", async (event) => {
    if (event.target.id !== "correction-form") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const caseId = new URLSearchParams(location.search).get("id");
    const dialog = document.querySelector("#correction-dialog");
    const suggestion = await findSuggestion(caseId, dialog.dataset.suggestionId);
    const value = document.querySelector("#correction-value").value.trim();
    if (!suggestion || !value) { showFailure("The correction could not be matched to its suggestion. Reload and try again."); return; }
    try {
      await confirmSuggestionAsFact(buildFact(caseId, suggestion, value, "corrected"), suggestion.id);
      dialog.close();
      location.reload();
    } catch {
      showFailure("The correction could not be saved on this device. Nothing was changed. Try again.");
    }
  }, true);
}
