export function formatStorageBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 bytes";
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function describeStorageHealth({ supported = true, persisted = false, usage = 0, quota = 0 } = {}) {
  if (!supported) return {
    state: "unavailable",
    label: "Storage status unavailable",
    detail: "This browser does not expose storage estimates or durability status. Keep encrypted backups.",
    ratio: 0,
    remaining: null,
  };
  const safeUsage = Math.max(0, Number(usage) || 0);
  const safeQuota = Math.max(0, Number(quota) || 0);
  const ratio = safeQuota ? Math.min(1, safeUsage / safeQuota) : 0;
  const remaining = safeQuota ? Math.max(0, safeQuota - safeUsage) : null;
  if (persisted) return {
    state: "protected",
    label: "Protected from automatic cleanup",
    detail: "The browser reports persistent storage. Manual clearing, device loss, and quota limits can still affect local cases.",
    ratio,
    remaining,
  };
  if (ratio >= 0.8) return {
    state: "pressure",
    label: "Storage use is high",
    detail: "Estimated use is above 80% of this origin’s reported quota. Back up cases before adding large records.",
    ratio,
    remaining,
  };
  return {
    state: "managed",
    label: "Browser-managed storage",
    detail: "The browser may evict site data under storage pressure. Request protection and keep encrypted backups.",
    ratio,
    remaining,
  };
}
