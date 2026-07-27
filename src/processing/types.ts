export const PROCESSING_PIPELINE_VERSION = "local-processing.v1";

export type ProcessingStatus =
  | "queued"
  | "extracting"
  | "needs_ocr"
  | "ready_for_ai"
  | "retry_wait"
  | "failed"
  | "cancelled";

export type ProcessingFailureCode =
  | "unsupported_type"
  | "adapter_unavailable"
  | "corrupt_file"
  | "password_protected"
  | "file_too_large"
  | "too_many_pages"
  | "empty_text"
  | "output_too_large"
  | "transient_error"
  | "cancelled";

export interface ProcessingFailure {
  code: ProcessingFailureCode;
  message: string;
  retryable: boolean;
}

export interface FileDescriptor {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: number;
  sha256: string;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface NormalizedPage extends ExtractedPage {
  start: number;
  end: number;
}

export interface ExtractionArtifact {
  fileId: string;
  fileHash: string;
  pipelineVersion: typeof PROCESSING_PIPELINE_VERSION;
  adapterId: string;
  adapterVersion: string;
  extractedAt: string;
  text: string;
  pages: NormalizedPage[];
  warnings: string[];
}

export interface ProcessingJob {
  id: string;
  fileId: string;
  fileHash: string;
  pipelineVersion: typeof PROCESSING_PIPELINE_VERSION;
  status: ProcessingStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string;
  failure?: ProcessingFailure;
  artifact?: ExtractionArtifact;
  ocrReason?: string;
}

export type AdapterExtractionResult =
  | { kind: "text"; pages: ExtractedPage[]; warnings?: string[] }
  | { kind: "needs_ocr"; reason: string; warnings?: string[] };

export interface ExtractionContext {
  signal?: AbortSignal;
}

export interface DocumentExtractionAdapter {
  id: string;
  version: string;
  supports(file: FileDescriptor): boolean;
  extract(file: FileDescriptor, context: ExtractionContext): Promise<AdapterExtractionResult>;
}

export interface ProcessingQueueItem {
  job: ProcessingJob;
  file: FileDescriptor;
}
