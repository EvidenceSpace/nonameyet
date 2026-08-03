export function buildCaseCreationDraft(value, previous, { createId, now }) {
  const updatedAt = now();
  const createdAt = previous?.createdAt || updatedAt;
  return {
    id: previous?.id || createId("case"),
    type: "unpaid_freelance_work",
    ...value,
    checklist: [],
    status: "collecting",
    localStorageAcknowledgedAt: previous?.localStorageAcknowledgedAt || createdAt,
    createdAt,
    updatedAt,
  };
}

export function describeCaseCreationFailure(error) {
  if (error?.code === "upgrade_blocked") {
    return {
      state: "blocked",
      eyebrow: "SAFE STORAGE UPGRADE PAUSED",
      title: "Close other CaseFind tabs",
      detail: "Another open CaseFind tab is preventing a safe local storage upgrade. Your entries are still here and no case was changed.",
      instruction: "Close every other CaseFind tab, then try saving again. Do not clear browser site data.",
      retryLabel: "Try saving again",
    };
  }
  return {
    state: "unavailable",
    eyebrow: "LOCAL STORAGE UNAVAILABLE",
    title: "This private draft could not be saved",
    detail: "Your entries are still here. Nothing was changed or deleted.",
    instruction: "Check browser storage permissions and available device space, then try again. Do not clear site data if you need existing cases.",
    retryLabel: "Try saving again",
  };
}
