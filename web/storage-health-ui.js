import { describeStorageHealth, formatStorageBytes } from "./storage-health-model.js";

const boundary = document.querySelector(".library-boundary");
if (boundary) {
  const panel = document.createElement("section");
  panel.className = "storage-health";
  panel.setAttribute("aria-live", "polite");
  boundary.after(panel);

  async function inspect() {
    const storage = navigator.storage;
    const supported = Boolean(storage?.estimate);
    const estimate = supported ? await storage.estimate().catch(() => ({})) : {};
    const persistenceSupported = Boolean(storage?.persisted && storage?.persist);
    const persisted = persistenceSupported ? await storage.persisted().catch(() => false) : false;
    const usage = Number(estimate.usage) || 0;
    const quota = Number(estimate.quota) || 0;
    return { health: describeStorageHealth({ supported, persisted, usage, quota }), usage, quota, persistenceSupported, persisted };
  }

  function render(data, message = "") {
    const { health, usage, quota, persistenceSupported, persisted } = data;
    const percent = Math.round(health.ratio * 100);
    const estimateText = quota
      ? `${formatStorageBytes(usage)} used of ${formatStorageBytes(quota)} estimated quota`
      : `${formatStorageBytes(usage)} reported used`;
    panel.dataset.state = health.state;
    panel.innerHTML = `<div class="storage-health-main"><div class="storage-health-icon" aria-hidden="true">${health.state === "protected" ? "✓" : health.state === "pressure" ? "!" : "◈"}</div><div><span class="section-label">LOCAL STORAGE HEALTH</span><div class="storage-health-title"><strong>${health.label}</strong><span>${estimateText}</span></div><p>${health.detail}</p><div class="storage-meter" role="progressbar" aria-label="Estimated browser storage used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><i style="width:${percent}%"></i></div>${health.remaining !== null ? `<small>${formatStorageBytes(health.remaining)} of the reported origin quota remains.</small>` : ""}${message ? `<p class="storage-health-result">${message}</p>` : ""}</div></div>${persistenceSupported && !persisted ? '<button class="button-secondary storage-protect" type="button">Protect local storage</button>' : ""}`;
    const button = panel.querySelector(".storage-protect");
    if (button) button.onclick = async () => {
      button.disabled = true;
      button.textContent = "Requesting protection…";
      let granted = false;
      try { granted = await navigator.storage.persist(); } catch {}
      const next = await inspect();
      render(next, granted || next.persisted
        ? "Browser protection is active. Manual clearing and device loss can still remove local cases, so keep encrypted backups."
        : "This browser did not grant protection. Cases remain local and may be evicted under storage pressure; keep encrypted backups.");
    };
  }

  inspect().then(render).catch(() => render({
    health: describeStorageHealth({ supported: false }), usage: 0, quota: 0,
    persistenceSupported: false, persisted: false,
  }));
}
