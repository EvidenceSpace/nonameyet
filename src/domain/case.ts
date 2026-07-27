export const caseTypes = ["unpaid_freelance_work"] as const;
export type CaseType = (typeof caseTypes)[number];

export const caseStatuses = ["draft", "collecting", "reviewing", "ready", "archived"] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export const verificationStatuses = ["suggested", "confirmed", "corrected", "dismissed", "uncertain"] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export const checklistStatuses = ["missing", "found", "needs_review", "not_applicable"] as const;
export type ChecklistStatus = (typeof checklistStatuses)[number];

export type SourceLocator =
  | { kind: "pdf_page"; page: number; quote?: string }
  | { kind: "image_region"; x: number; y: number; width: number; height: number; quote?: string }
  | { kind: "text_range"; start: number; end: number; quote?: string }
  | { kind: "whole_file"; quote?: string };

export interface SourceReference {
  id: string;
  fileId: string;
  locator: SourceLocator;
  extractionVersion: string;
}

export interface CaseFact {
  id: string;
  caseId: string;
  label: string;
  value: string;
  status: VerificationStatus;
  confidence?: number;
  sourceReferences: SourceReference[];
  manuallyEntered: boolean;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  occurredAt?: string;
  title: string;
  description: string;
  status: VerificationStatus;
  sourceReferences: SourceReference[];
  manuallyEntered: boolean;
}

export interface ChecklistItem {
  id: string;
  key: string;
  label: string;
  status: ChecklistStatus;
  weight: number;
}

export interface CaseConflict {
  id: string;
  caseId: string;
  label: string;
  factIds: string[];
  resolved: boolean;
}

export interface CaseRecord {
  id: string;
  type: CaseType;
  title: string;
  status: CaseStatus;
  goal: string;
  summary: string;
  checklist: ChecklistItem[];
  facts: CaseFact[];
  events: CaseEvent[];
  conflicts: CaseConflict[];
}

export function hasValidProvenance(item: CaseFact | CaseEvent): boolean {
  return item.manuallyEntered || item.sourceReferences.length > 0;
}

export function canConfirm(item: CaseFact | CaseEvent): boolean {
  return hasValidProvenance(item) && item.status !== "dismissed";
}
