export const CASE_HISTORY_KEY = "casefind.local-case-history.v1";

export function readLocalCaseHistory(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(CASE_HISTORY_KEY) || "null");
    if (value?.version !== 1 || typeof value.firstStoredAt !== "string" || typeof value.lastStoredAt !== "string") return null;
    return value;
  } catch {
    return null;
  }
}

export function noteLocalCaseStored(storage = globalThis.localStorage, now = () => new Date().toISOString()) {
  try {
    const recordedAt = now();
    const previous = readLocalCaseHistory(storage);
    storage.setItem(CASE_HISTORY_KEY, JSON.stringify({
      version: 1,
      firstStoredAt: previous?.firstStoredAt || recordedAt,
      lastStoredAt: recordedAt,
    }));
    return true;
  } catch {
    return false;
  }
}

export function describeEmptyCaseLibrary(hasHistory) {
  if (!hasHistory) {
    return {
      state: "first-use",
      title: "No local cases yet",
      detail: "Create a private case or restore an encrypted backup from another device.",
      primaryLabel: "Create first case",
    };
  }
  return {
    state: "history",
    eyebrow: "LOCAL CASE HISTORY FOUND",
    title: "No local cases are available",
    detail: "This browser profile previously recorded at least one successfully stored case, but none are available now.",
    explanation: "Cases may have been permanently deleted, cleared with site data, or removed by browser storage management. CaseFind cannot determine which happened or recover them automatically.",
    instruction: "If you downloaded an encrypted .casefind backup, restore it before creating replacement work. Avoid clearing additional site data while checking.",
    primaryLabel: "Restore encrypted backup",
  };
}
