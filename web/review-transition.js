import { openDatabase } from "./storage.js";

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
