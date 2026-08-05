export const PROCESSING_RUN_FAILED_MESSAGE = "Processing stopped unexpectedly. The original remains stored locally. Try processing this source again.";
export const PROCESSING_STORAGE_UNAVAILABLE_MESSAGE = "CaseFind could not confirm the latest local processing status. The original remains stored locally. Reload this case before trying again.";

export function buildUnexpectedProcessingFailure(runMarker, at = new Date().toISOString()) {
  const validIdentity = runMarker
    && ["fileId", "caseId", "fileHash"].every((key) => (
      typeof runMarker[key] === "string" && Boolean(runMarker[key])
    ));
  if (!validIdentity) throw new TypeError("Processing run identity is invalid.");
  if (typeof at !== "string" || !at || Number.isNaN(Date.parse(at))) {
    throw new TypeError("Processing recovery time is invalid.");
  }
  return {
    fileId: runMarker.fileId,
    caseId: runMarker.caseId,
    fileHash: runMarker.fileHash,
    status: "failed",
    message: PROCESSING_RUN_FAILED_MESSAGE,
    updatedAt: at,
    failure: { code: "transient_error", retryable: true },
  };
}
