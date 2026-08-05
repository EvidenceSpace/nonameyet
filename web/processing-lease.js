const PROCESSING_LOCK_PREFIX = "casefind:processing:";

export const PROCESSING_BUSY_MESSAGE =
  "Another CaseFind tab is processing this source. This tab did not start a duplicate run.";
export const PROCESSING_LEASE_UNAVAILABLE_MESSAGE =
  "CaseFind could not safely coordinate local processing across tabs in this browser. Processing was not started. Update the browser and reload this case.";
export const PROCESSING_ACTIVE_ELSEWHERE_MESSAGE =
  "Processing is active in another CaseFind tab. This tab will not start a duplicate run; return here after the other run finishes.";
export const PROCESSING_OWNERSHIP_UNCONFIRMED_MESSAGE =
  "CaseFind cannot safely confirm who owns this processing run in this browser. It was left unchanged; update the browser and reload this case.";

export function processingLeaseSupported(
  lockManager = globalThis.navigator?.locks,
) {
  return Boolean(lockManager && typeof lockManager.request === "function");
}

export function processingLockName(fileId) {
  if (typeof fileId !== "string" || !fileId.trim()) {
    throw new TypeError("Processing lease file identity is invalid.");
  }
  return `${PROCESSING_LOCK_PREFIX}${fileId}`;
}

export async function withProcessingLease(
  fileId,
  task,
  { lockManager = globalThis.navigator?.locks } = {},
) {
  const name = processingLockName(fileId);
  if (typeof task !== "function")
    throw new TypeError("Processing lease task is invalid.");
  if (!processingLeaseSupported(lockManager))
    return { acquired: false, reason: "unsupported" };

  let acquired = false;
  let value;
  try {
    await lockManager.request(
      name,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        if (!lock) return;
        acquired = true;
        value = await task();
      },
    );
  } catch (error) {
    if (acquired) throw error;
    return { acquired: false, reason: "unavailable" };
  }
  return acquired
    ? { acquired: true, value }
    : { acquired: false, reason: "busy" };
}
