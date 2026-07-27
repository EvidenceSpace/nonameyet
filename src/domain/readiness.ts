import type { CaseRecord, ChecklistItem } from "./case.js";

export interface ReadinessResult {
  score: number;
  completedWeight: number;
  totalApplicableWeight: number;
  unresolvedConflictCount: number;
  unverifiedItemCount: number;
}

function completedWeight(item: ChecklistItem): number {
  return item.status === "found" ? item.weight : 0;
}

export function calculateReadiness(record: CaseRecord): ReadinessResult {
  const applicable = record.checklist.filter((item) => item.status !== "not_applicable");
  const totalApplicableWeight = applicable.reduce((total, item) => total + item.weight, 0);
  const foundWeight = applicable.reduce((total, item) => total + completedWeight(item), 0);
  const unresolvedConflictCount = record.conflicts.filter((conflict) => !conflict.resolved).length;
  const unverifiedItemCount = [...record.facts, ...record.events].filter(
    (item) => item.status === "suggested" || item.status === "uncertain",
  ).length;

  const completeness = totalApplicableWeight === 0 ? 0 : foundWeight / totalApplicableWeight;
  const conflictPenalty = Math.min(0.25, unresolvedConflictCount * 0.05);
  const reviewPenalty = Math.min(0.2, unverifiedItemCount * 0.02);
  const score = Math.max(0, Math.min(100, Math.round((completeness - conflictPenalty - reviewPenalty) * 100)));

  return {
    score,
    completedWeight: foundWeight,
    totalApplicableWeight,
    unresolvedConflictCount,
    unverifiedItemCount,
  };
}
