export function hasMeaningfulIntakeDraft({ title = "", client = "", amount = "", summary = "", goal = "understand", acknowledged = false } = {}) {
  return [title, client, amount, summary].some((value) => String(value).trim().length > 0) || goal !== "understand" || acknowledged === true;
}

export function describeIntakeDraftLifecycle({ hasDraft, creating = false, saved = false }) {
  if (saved) return { state: "saved", message: "Saved on this device." };
  if (creating) return { state: "saving", message: "Saving this private draft on this device…" };
  if (hasDraft) return { state: "unsaved", message: "Not saved yet — leaving this page will discard these entries." };
  return { state: "pristine", message: "Nothing has been saved yet. Case creation happens only after the final confirmation." };
}

export function shouldWarnBeforeIntakeExit({ hasDraft, saved = false }) {
  return hasDraft && !saved;
}
