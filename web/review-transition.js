import { createId, deleteFact, getFilesForCase, openDatabase, saveFact } from "./storage.js";

const activeReviewActions = new Set();
const renderedSuggestionSnapshots = new Map();

export function syncRenderedSuggestionSnapshots(suggestions = []) {
  renderedSuggestionSnapshots.clear();
  for (const suggestion of suggestions) {
    if (!isNonEmptyString(suggestion?.id)) continue;
    try { renderedSuggestionSnapshots.set(suggestion.id, structuredClone(suggestion)); }
    catch { /* A malformed snapshot must never become actionable. */ }
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function storedValuesMatch(current, expected) {
  if (!current || !expected) return false;
  try {
    return JSON.stringify(current) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

function validSuggestionSnapshot(suggestion) {
  return isNonEmptyString(suggestion?.id)
    && isNonEmptyString(suggestion.caseId)
    && isNonEmptyString(suggestion.fileId)
    && isNonEmptyString(suggestion.label)
    && isNonEmptyString(suggestion.value)
    && ["suggested", "uncertain"].includes(suggestion.status)
    && suggestion.aiSuggested === true
    && suggestion.decidedByUser === false;
}

function validReviewTransition(fact, suggestion) {
  if (!fact || !suggestion) return false;
  const confirmedValue = fact.status === "confirmed" && fact.value === suggestion.value;
  const correctedValue = fact.status === "corrected" && isNonEmptyString(fact.value);
  return isNonEmptyString(fact.id)
    && isNonEmptyString(fact.caseId)
    && isNonEmptyString(fact.sourceFileId)
    && isNonEmptyString(fact.createdAt)
    && validSuggestionSnapshot(suggestion)
    && fact.caseId === suggestion.caseId
    && fact.sourceFileId === suggestion.fileId
    && fact.label === suggestion.label
    && fact.manuallyEntered === false
    && fact.aiSuggested === true
    && fact.decidedByUser === true
    && (confirmedValue || correctedValue)
    && storedValuesMatch(fact.sourceReference, suggestion.sourceReference);
}

async function commitSuggestionDisposition(expectedSuggestion, disposition, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  if (!validSuggestionSnapshot(expectedSuggestion) || !["uncertain", "dismissed"].includes(disposition)) {
    throw new TypeError("Invalid suggestion disposition identity.");
  }
  const db = await openDatabaseImpl();
  try {
    const tx = db.transaction(["suggestions", "cases"], "readwrite");
    const suggestions = tx.objectStore("suggestions");
    const cases = tx.objectStore("cases");
    let transitionError;
    let suggestionRequest;
    let caseRequest;
    let writeRequest;
    const abortWith = (error) => {
      transitionError = error;
      try { tx.abort(); }
      catch (abortError) { transitionError = transitionError || abortError; }
    };
    const completion = new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = () => {
        if (settled) return;
        settled = true;
        reject(transitionError || tx.error || writeRequest?.error || caseRequest?.error || suggestionRequest?.error || new Error("Suggestion disposition aborted"));
      };
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(undefined);
      };
      tx.onerror = rejectOnce;
      tx.onabort = rejectOnce;
    });

    suggestionRequest = suggestions.get(expectedSuggestion.id);
    suggestionRequest.onsuccess = () => {
      if (!storedValuesMatch(suggestionRequest.result, expectedSuggestion)) {
        abortWith(new ReviewTransitionError(
          "stale_suggestion",
          "The reviewed suggestion changed before this decision could be saved.",
        ));
        return;
      }
      caseRequest = cases.get(expectedSuggestion.caseId);
      caseRequest.onsuccess = () => {
        if (!caseRequest.result) {
          abortWith(new ReviewTransitionError(
            "case_missing",
            "The case no longer exists on this device.",
          ));
          return;
        }
        try {
          const updatedAt = now();
          if (!isNonEmptyString(updatedAt)) throw new TypeError("Invalid disposition timestamp.");
          writeRequest = disposition === "dismissed"
            ? suggestions.delete(expectedSuggestion.id)
            : suggestions.put({ ...expectedSuggestion, status: "uncertain", updatedAt });
          cases.put({ ...caseRequest.result, updatedAt });
        } catch (error) {
          abortWith(new ReviewTransitionError(
            "write_failed",
            "The suggestion decision could not be saved atomically.",
            error,
          ));
        }
      };
    };

    await completion;
    return true;
  } finally { db.close(); }
}

export function markSuggestionUncertain(expectedSuggestion, options) {
  return commitSuggestionDisposition(expectedSuggestion, "uncertain", options);
}

export function dismissSuggestion(expectedSuggestion, options) {
  return commitSuggestionDisposition(expectedSuggestion, "dismissed", options);
}

export class ReviewTransitionError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "ReviewTransitionError";
    this.code = code;
    this.cause = cause;
  }
}

export async function confirmSuggestionAsFact(fact, expectedSuggestion, {
  openDatabaseImpl = openDatabase,
  now = () => new Date().toISOString(),
} = {}) {
  if (!validReviewTransition(fact, expectedSuggestion)) {
    throw new TypeError("Invalid review transition identity.");
  }
  const db = await openDatabaseImpl();
  try {
    const tx = db.transaction(["facts", "suggestions", "cases"], "readwrite");
    const facts = tx.objectStore("facts");
    const suggestions = tx.objectStore("suggestions");
    const cases = tx.objectStore("cases");
    let transitionError;
    let suggestionRequest;
    let caseRequest;
    let factRequest;
    const abortWith = (error) => {
      transitionError = error;
      try { tx.abort(); }
      catch (abortError) { transitionError = transitionError || abortError; }
    };
    const completion = new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = () => {
        if (settled) return;
        settled = true;
        reject(transitionError || tx.error || factRequest?.error || caseRequest?.error || suggestionRequest?.error || new Error("Review transaction aborted"));
      };
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(undefined);
      };
      tx.onerror = rejectOnce;
      tx.onabort = rejectOnce;
    });

    suggestionRequest = suggestions.get(expectedSuggestion.id);
    suggestionRequest.onsuccess = () => {
      if (!storedValuesMatch(suggestionRequest.result, expectedSuggestion)) {
        abortWith(new ReviewTransitionError(
          "stale_suggestion",
          "The reviewed suggestion changed before this decision could be saved.",
        ));
        return;
      }
      caseRequest = cases.get(fact.caseId);
      caseRequest.onsuccess = () => {
        if (!caseRequest.result) {
          abortWith(new ReviewTransitionError(
            "case_missing",
            "The case no longer exists on this device.",
          ));
          return;
        }
        try {
          const updatedAt = now();
          factRequest = facts.add(fact);
          suggestions.delete(expectedSuggestion.id);
          cases.put({ ...caseRequest.result, updatedAt });
        } catch (error) {
          abortWith(new ReviewTransitionError(
            "write_failed",
            "The review decision could not be saved atomically.",
            error,
          ));
        }
      };
    };

    await completion;
    return true;
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
  if (!message) return;
  message.className = "upload-message error";
  message.textContent = text;
}

function ensureReviewStatus(target = "review") {
  const id = target === "correction" ? "correction-review-status" : "review-decision-status";
  let status = document.querySelector(`#${id}`);
  if (status) return status;
  status = document.createElement("p");
  status.id = id;
  status.className = "review-decision-status";
  status.setAttribute("role", "alert");
  status.hidden = true;
  if (target === "correction") {
    const form = document.querySelector("#correction-form");
    if (!form) return null;
    const actions = form.querySelector(".dialog-actions");
    if (actions) actions.before(status);
    else form.append(status);
  } else {
    const list = document.querySelector("#suggestion-list");
    if (!list) return null;
    list.before(status);
  }
  return status;
}

function clearReviewFailure() {
  document.querySelectorAll(".review-decision-status").forEach((status) => {
    status.hidden = true;
    status.textContent = "";
  });
}

function reviewFailureText(error, fallback) {
  if (error?.code === "stale_suggestion") {
    return "This suggestion changed in another tab. Nothing was confirmed. Reload and review the latest version.";
  }
  if (error?.code === "case_missing") {
    return "This case is no longer available on this device. Nothing was changed.";
  }
  return fallback;
}

function showReviewFailure(error, fallback, target = "review") {
  const status = ensureReviewStatus(target);
  if (!status) { showFailure(fallback); return; }
  status.hidden = false;
  status.textContent = reviewFailureText(error, fallback);
}

function setCardBusy(card, busy) {
  if (!card) return;
  if (busy) card.setAttribute("aria-busy", "true");
  else card.removeAttribute("aria-busy");
  card.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
}

function setCorrectionBusy(dialog, busy) {
  if (!dialog) return;
  if (busy) dialog.setAttribute("aria-busy", "true");
  else dialog.removeAttribute("aria-busy");
  const submit = dialog.querySelector('button[type="submit"]');
  const input = dialog.querySelector("#correction-value");
  if (submit) submit.disabled = busy;
  if (input) input.readOnly = busy;
}

function requireRenderedSuggestion(suggestionId) {
  const suggestion = renderedSuggestionSnapshots.get(suggestionId);
  if (!suggestion) {
    throw new ReviewTransitionError(
      "stale_suggestion",
      "The displayed suggestion is no longer available.",
    );
  }
  return structuredClone(suggestion);
}

async function runReviewAction(suggestionId, card, action, fallback, {
  errorTarget = "review",
  busyRoot = null,
} = {}) {
  if (!isNonEmptyString(suggestionId) || activeReviewActions.has(suggestionId)) return;
  activeReviewActions.add(suggestionId);
  clearReviewFailure();
  setCardBusy(card, true);
  setCorrectionBusy(busyRoot, true);
  try {
    await action();
    location.reload();
  } catch (error) {
    showReviewFailure(error, fallback, errorTarget);
  } finally {
    activeReviewActions.delete(suggestionId);
    setCardBusy(card, false);
    setCorrectionBusy(busyRoot, false);
  }
}

if (location.pathname.endsWith("/case.html")) {
  document.addEventListener("click", (event) => {
    const correctButton = event.target.closest?.(".correct-suggestion");
    if (correctButton) {
      document.querySelector("#correction-dialog").dataset.suggestionId = correctButton.closest(".suggestion-card")?.dataset.id || "";
      clearReviewFailure();
      return;
    }
    const dismissButton = event.target.closest?.(".dismiss-suggestion");
    if (dismissButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      const card = dismissButton.closest(".suggestion-card");
      const suggestionId = card?.dataset.id;
      void runReviewAction(
        suggestionId,
        card,
        async () => {
          const suggestion = requireRenderedSuggestion(suggestionId);
          await dismissSuggestion(suggestion);
        },
        "The suggestion could not be dismissed on this device. Nothing was changed. Try again.",
      );
      return;
    }
    const uncertainButton = event.target.closest?.(".uncertain-suggestion");
    if (uncertainButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      const card = uncertainButton.closest(".suggestion-card");
      const suggestionId = card?.dataset.id;
      void runReviewAction(
        suggestionId,
        card,
        async () => {
          const suggestion = requireRenderedSuggestion(suggestionId);
          await markSuggestionUncertain(suggestion);
        },
        "The review status could not be changed on this device. Nothing was changed. Try again.",
      );
      return;
    }
    const deleteFactButton = event.target.closest?.(".delete-fact");
    if (deleteFactButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      void (async () => {
        try { await deleteFact(deleteFactButton.dataset.id); location.reload(); }
        catch { showFailure("The fact could not be removed from this device. Nothing was changed. Try again."); }
      })();
      return;
    }
    const button = event.target.closest?.(".confirm-suggestion");
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const caseId = new URLSearchParams(location.search).get("id");
    const card = button.closest(".suggestion-card");
    const suggestionId = card?.dataset.id;
    void runReviewAction(
      suggestionId,
      card,
      async () => {
        const suggestion = requireRenderedSuggestion(suggestionId);
        await confirmSuggestionAsFact(
          buildFact(caseId, suggestion, suggestion.value, "confirmed"),
          suggestion,
        );
      },
      "The suggestion could not be confirmed on this device. Nothing was changed. Try again.",
    );
  }, true);

  document.addEventListener("submit", (event) => {
    if (event.target.id === "fact-form") {
      event.preventDefault(); event.stopImmediatePropagation();
      void (async () => {
        try {
          const caseId = new URLSearchParams(location.search).get("id");
          const sourceFileId = document.querySelector("#fact-source").value;
          const file = (await getFilesForCase(caseId)).find((item) => item.id === sourceFileId);
          const value = document.querySelector("#fact-value").value.trim();
          if (!file || !value) { showFailure("Choose a stored source and enter the fact before saving."); return; }
          const fact = {
            id: createId("fact"), caseId, type: document.querySelector("#fact-type").value, value,
            note: document.querySelector("#fact-note").value.trim(), sourceFileId,
            sourceReference: { fileId: sourceFileId, sha256: file.sha256, locator: { kind: "whole_file" } },
            status: "confirmed", manuallyEntered: true, createdAt: new Date().toISOString(),
          };
          await saveFact(fact);
          document.querySelector("#fact-dialog").close();
          location.reload();
        } catch {
          showFailure("The fact could not be saved on this device. Nothing was changed. Try again.");
        }
      })();
      return;
    }
    if (event.target.id !== "correction-form") return;
    event.preventDefault(); event.stopImmediatePropagation();
    const caseId = new URLSearchParams(location.search).get("id");
    const dialog = document.querySelector("#correction-dialog");
    const suggestionId = dialog.dataset.suggestionId;
    const card = [...document.querySelectorAll(".suggestion-card")]
      .find((candidate) => candidate.dataset.id === suggestionId);
    const value = document.querySelector("#correction-value").value.trim();
    if (!value) { showReviewFailure(null, "Enter the accurate value before saving this correction.", "correction"); return; }
    void runReviewAction(
      suggestionId,
      card,
      async () => {
        const suggestion = requireRenderedSuggestion(suggestionId);
        await confirmSuggestionAsFact(
          buildFact(caseId, suggestion, value, "corrected"),
          suggestion,
        );
        dialog.close();
      },
      "The correction could not be saved on this device. Nothing was changed. Try again.",
      { errorTarget: "correction", busyRoot: dialog },
    );
  }, true);
}
