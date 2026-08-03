import { isValidExtractionArtifact } from "./extraction-artifact.js";

export const STALE_EXTRACTION_MESSAGE = "Stored extraction does not match this original. Process the source again.";
export const INVALID_EXTRACTION_MESSAGE = "Stored extraction is invalid. Process the source again.";

export function inspectProcessingJob(file, job) {
  if (!job) return { status: "unprocessed", message: "" };
  if (!file || job.fileId !== file.id || job.caseId !== file.caseId || job.fileHash !== file.sha256) {
    return { status: "failed", message: STALE_EXTRACTION_MESSAGE };
  }
  if (job.status === "ready_for_ai" && !isValidExtractionArtifact(job.artifact)) {
    return { status: "failed", message: INVALID_EXTRACTION_MESSAGE };
  }
  return { status: job.status || "unprocessed", message: job.message || "" };
}
