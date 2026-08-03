import { describeStorageRecovery } from "./storage-recovery-model.js";

export function renderStorageRecovery(container, error, { retry, backHref = "index.html", backLabel = "Return home" } = {}) {
  const recovery = describeStorageRecovery(error);
  container.hidden = false;
  container.dataset.storageRecovery = recovery.state;
  container.innerHTML = `<section class="storage-recovery" data-state="${recovery.state}" role="alert"><div class="storage-recovery-icon" aria-hidden="true">${recovery.state === "blocked" ? "↻" : "!"}</div><div class="storage-recovery-copy"><span class="section-label">${recovery.eyebrow}</span><h2>${recovery.title}</h2><p>${recovery.detail}</p><strong>${recovery.instruction}</strong><p class="storage-recovery-status" role="status"></p><div class="storage-recovery-actions"><button class="button storage-recovery-retry" type="button">${recovery.retryLabel}</button><a class="button-secondary" href="${backHref}">${backLabel}</a></div></div></section>`;
  const button = container.querySelector(".storage-recovery-retry");
  const status = container.querySelector(".storage-recovery-status");
  if (!retry) { button.remove(); return recovery; }
  button.onclick = async () => {
    button.disabled = true;
    button.textContent = "Retrying safely…";
    status.textContent = "Checking local storage again. No data will be cleared.";
    await retry();
  };
  return recovery;
}
