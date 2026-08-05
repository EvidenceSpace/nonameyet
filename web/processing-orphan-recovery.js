import { getProcessingForCase, saveProcessingIfCurrent } from "./storage.js";
import { withProcessingLease } from "./processing-lease.js";
import { buildUnexpectedProcessingFailure } from "./processing-run-recovery.js";

function hasExactProcessingIdentity(job, caseId) {
  return (
    job?.caseId === caseId &&
    ["fileId", "caseId", "fileHash"].every(
      (key) => typeof job[key] === "string" && Boolean(job[key]),
    )
  );
}

export async function recoverOrphanedProcessingRuns(
  caseId,
  {
    getProcessingForCaseImpl = getProcessingForCase,
    saveProcessingIfCurrentImpl = saveProcessingIfCurrent,
    withProcessingLeaseImpl = withProcessingLease,
    now = () => new Date().toISOString(),
  } = {},
) {
  if (typeof caseId !== "string" || !caseId) {
    throw new TypeError("Processing recovery case identity is invalid.");
  }
  const jobs = await getProcessingForCaseImpl(caseId);
  if (!Array.isArray(jobs))
    throw new TypeError("Processing recovery jobs are invalid.");

  const outcome = { recovered: [], active: [], unconfirmed: [], invalid: 0 };
  for (const job of jobs) {
    if (job?.status !== "extracting") continue;
    if (!hasExactProcessingIdentity(job, caseId)) {
      outcome.invalid += 1;
      continue;
    }
    const lease = await withProcessingLeaseImpl(job.fileId, async () => {
      const failure = buildUnexpectedProcessingFailure(job, now());
      return saveProcessingIfCurrentImpl(job, failure);
    });
    if (lease?.acquired) {
      if (lease.value === true) outcome.recovered.push(job.fileId);
    } else if (lease?.reason === "busy") {
      outcome.active.push(job.fileId);
    } else {
      outcome.unconfirmed.push(job.fileId);
    }
  }
  return outcome;
}
