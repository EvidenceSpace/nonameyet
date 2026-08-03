export function describeStorageRecovery(error, { scope = "library" } = {}) {
  const workspace = scope === "workspace";
  if (error?.code === "upgrade_blocked") {
    return {
      state: "blocked",
      eyebrow: "SAFE STORAGE UPGRADE PAUSED",
      title: "Close other CaseFind tabs",
      detail: workspace
        ? "Another open CaseFind tab is preventing a safe local storage upgrade. Your local case data was not changed."
        : "Another open CaseFind tab is preventing a safe local storage upgrade. Your local cases were not changed.",
      instruction: "Close every other CaseFind tab, then retry here. Do not clear browser site data.",
      retryLabel: workspace ? "Retry opening case" : "Retry opening cases",
    };
  }
  return {
    state: "unavailable",
    eyebrow: "LOCAL STORAGE UNAVAILABLE",
    title: workspace ? "This case could not be opened safely" : "Your cases could not be opened safely",
    detail: "CaseFind could not access this browser’s local database. Nothing was changed or deleted.",
    instruction: "Check browser storage permissions and available device space, then retry. Do not clear site data if you need existing cases.",
    retryLabel: workspace ? "Retry opening case" : "Retry opening cases",
  };
}
