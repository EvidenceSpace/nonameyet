import { conflictStats, detectFactConflicts } from "./consistency-model.js";
import { checklistStats } from "./checklist-model.js";

const VERIFIED = new Set(["confirmed", "corrected"]);
function round(value) { return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100; }

export function calculateRecordReadiness({ record, files, facts, suggestions }) {
  const fileMap = new Map(files.map((file) => [file.id, file]));
  const verified = facts.filter((fact) => {
    if (!VERIFIED.has(fact.status)) return false;
    const reference = fact.sourceReference || fact.sourceReferences?.[0];
    const file = fileMap.get(fact.sourceFileId || reference?.fileId);
    return Boolean(reference && file && reference.fileId === file.id && reference.sha256 === file.sha256);
  });
  const brokenProvenance = facts.filter((fact) => VERIFIED.has(fact.status) && !verified.includes(fact)).length;
  const pending = suggestions.filter((item) => item.status === "suggested" || item.status === "uncertain").length;
  const reviewed = suggestions.length - pending;
  const conflicts = detectFactConflicts({ record, files, facts });
  const conflictSummary = conflictStats(conflicts);
  const reviewTotal = suggestions.length + conflictSummary.total;
  const reviewResolved = reviewed + conflictSummary.resolved;
  const checklist = checklistStats(record);
  const checklistRatio = round(checklist.reviewed / checklist.total);
  const sourceRatio = round(files.length / 3);
  const factRatio = round(verified.length / 3);
  const reviewRatio = files.length === 0 ? 0 : reviewTotal ? round(reviewResolved / reviewTotal) : 1;
  const components = [
    { key: "checklist", label: "Checklist review", score: Math.round(checklistRatio * 30), maximum: 30, detail: `${checklist.found} found · ${checklist.needsReview} needs review · ${checklist.missing} missing · ${checklist.notApplicable} not applicable` },
    { key: "sources", label: "Original records", score: Math.round(sourceRatio * 25), maximum: 25, detail: `${files.length} record${files.length === 1 ? "" : "s"} stored locally` },
    { key: "facts", label: "Verified facts", score: Math.round(factRatio * 30), maximum: 30, detail: `${verified.length} source-linked verified fact${verified.length === 1 ? "" : "s"}` },
    { key: "review", label: "Review completion", score: Math.round(reviewRatio * 15), maximum: 15, detail: pending || conflictSummary.unresolved ? `${pending} suggestion${pending === 1 ? "" : "s"} and ${conflictSummary.unresolved} potential difference${conflictSummary.unresolved === 1 ? "" : "s"} awaiting review` : files.length ? "No review items awaiting a decision" : "Add records before review" },
  ];
  const score = components.reduce((sum, item) => sum + item.score, 0);
  const nextSteps = [];
  if (!files.length) nextSteps.push("Add at least one original record.");
  else if (files.length < 3) nextSteps.push("Add other relevant record types for fuller context.");
  if (checklist.needsReview) nextSteps.push(`Resolve ${checklist.needsReview} checklist categor${checklist.needsReview === 1 ? "y" : "ies"} marked needs review.`);
  else if (checklist.missing) nextSteps.push(`Review ${checklist.missing} missing checklist categor${checklist.missing === 1 ? "y" : "ies"}.`);
  if (brokenProvenance) nextSteps.push(`Repair ${brokenProvenance} verified fact${brokenProvenance === 1 ? "" : "s"} with missing or changed source provenance.`);
  if (conflictSummary.unresolved) nextSteps.push(`Compare ${conflictSummary.unresolved} potential difference${conflictSummary.unresolved === 1 ? "" : "s"} across verified sources.`);
  if (!verified.length) nextSteps.push("Confirm at least one important fact against its source.");
  else if (verified.length < 3) nextSteps.push("Verify more important dates, amounts, delivery, or approval details.");
  if (pending) nextSteps.push(`Resolve ${pending} suggestion${pending === 1 ? "" : "s"} still awaiting your decision.`);
  const level = score >= 75 ? "Ready to review" : score >= 50 ? "Organized" : score >= 25 ? "Building" : "Starting";
  return { score, level, components, checklist, verifiedFactCount: verified.length, pendingReviewCount: pending, brokenProvenanceCount: brokenProvenance, conflictCount: conflictSummary.total, unresolvedConflictCount: conflictSummary.unresolved, nextSteps: nextSteps.slice(0, 4) };
}
