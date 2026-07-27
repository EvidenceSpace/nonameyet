import { wrapUntrustedText } from "../ai/untrusted.js";
import { ExtractionOutputError, buildExtractionArtifact, DEFAULT_MAX_EXTRACTED_CHARACTERS } from "./normalize.js";
import {
  PROCESSING_PIPELINE_VERSION,
  type DocumentExtractionAdapter,
  type FileDescriptor,
  type ProcessingFailure,
  type ProcessingJob,
  type ProcessingStatus,
} from "./types.js";

const ALLOWED_TRANSITIONS: Readonly<Record<ProcessingStatus, readonly ProcessingStatus[]>> = {
  queued: ["extracting", "failed", "cancelled"],
  extracting: ["needs_ocr", "ready_for_ai", "retry_wait", "failed", "cancelled"],
  needs_ocr: ["queued", "cancelled"],
  ready_for_ai: ["queued", "cancelled"],
  retry_wait: ["queued", "cancelled"],
  failed: ["queued", "cancelled"],
  cancelled: ["queued"],
};

export class ProcessingAdapterError extends Error {
  constructor(
    message: string,
    readonly code: "adapter_unavailable" | "corrupt_file" | "transient_error",
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ProcessingAdapterError";
  }
}

export interface RunProcessingOptions {
  adapters: readonly DocumentExtractionAdapter[];
  now?: () => Date;
  signal?: AbortSignal;
  maxCharacters?: number;
  baseRetryMs?: number;
  onTransition?: (job: ProcessingJob) => void;
}

function withoutOutcome(job: ProcessingJob): Omit<ProcessingJob, "nextRetryAt" | "failure" | "artifact" | "ocrReason"> {
  const { nextRetryAt: _nextRetryAt, failure: _failure, artifact: _artifact, ocrReason: _ocrReason, ...base } = job;
  return base;
}

function transition(
  job: ProcessingJob,
  status: ProcessingStatus,
  at: Date,
  patch: Partial<Pick<ProcessingJob, "nextRetryAt" | "failure" | "artifact" | "ocrReason">> = {},
): ProcessingJob {
  if (!ALLOWED_TRANSITIONS[job.status].includes(status)) {
    throw new Error(`Illegal processing transition: ${job.status} -> ${status}`);
  }
  return { ...withoutOutcome(job), ...patch, status, updatedAt: at.toISOString() };
}

function notify(job: ProcessingJob, callback?: (job: ProcessingJob) => void): ProcessingJob {
  callback?.(job);
  return job;
}

function failureFromError(error: unknown): ProcessingFailure {
  if (error instanceof ExtractionOutputError) {
    return { code: error.code, message: error.message, retryable: false };
  }
  if (error instanceof ProcessingAdapterError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  return { code: "transient_error", message: error instanceof Error ? error.message : "Unknown extraction error.", retryable: true };
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted === true || (error instanceof Error && error.name === "AbortError");
}

export function createProcessingJob(args: {
  id: string;
  file: FileDescriptor;
  now?: Date;
  maxAttempts?: number;
}): ProcessingJob {
  const now = args.now ?? new Date();
  return {
    id: args.id,
    fileId: args.file.id,
    fileHash: args.file.sha256,
    pipelineVersion: PROCESSING_PIPELINE_VERSION,
    status: "queued",
    attempts: 0,
    maxAttempts: args.maxAttempts ?? 3,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function runProcessingJob(
  job: ProcessingJob,
  file: FileDescriptor,
  options: RunProcessingOptions,
): Promise<ProcessingJob> {
  const now = options.now ?? (() => new Date());
  if (job.status !== "queued") throw new Error(`Only queued jobs can run; received ${job.status}.`);
  if (job.fileId !== file.id || job.fileHash !== file.sha256) {
    return notify(transition(job, "failed", now(), { failure: { code: "corrupt_file", message: "The job no longer matches the original file and hash.", retryable: false } }), options.onTransition);
  }
  if (options.signal?.aborted) {
    return notify(transition(job, "cancelled", now(), { failure: { code: "cancelled", message: "Processing was cancelled.", retryable: false } }), options.onTransition);
  }

  const adapter = options.adapters.find((candidate) => candidate.supports(file));
  if (!adapter) {
    return notify(transition(job, "failed", now(), { failure: { code: "unsupported_type", message: `No local extraction adapter supports ${file.type || "this file type"}.`, retryable: false } }), options.onTransition);
  }

  let current = transition({ ...job, attempts: job.attempts + 1 }, "extracting", now());
  notify(current, options.onTransition);

  try {
    const result = await adapter.extract(file, options.signal ? { signal: options.signal } : {});
    if (options.signal?.aborted) throw new DOMException("Processing was cancelled.", "AbortError");
    if (result.kind === "needs_ocr") {
      return notify(transition(current, "needs_ocr", now(), { ocrReason: result.reason }), options.onTransition);
    }

    const artifact = buildExtractionArtifact({
      fileId: file.id,
      fileHash: file.sha256,
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      pages: result.pages,
      extractedAt: now().toISOString(),
      maxCharacters: options.maxCharacters ?? DEFAULT_MAX_EXTRACTED_CHARACTERS,
      ...(result.warnings ? { warnings: result.warnings } : {}),
    });
    return notify(transition(current, "ready_for_ai", now(), { artifact }), options.onTransition);
  } catch (error) {
    if (isAbort(error, options.signal)) {
      return notify(transition(current, "cancelled", now(), { failure: { code: "cancelled", message: "Processing was cancelled.", retryable: false } }), options.onTransition);
    }
    const failure = failureFromError(error);
    if (failure.retryable && current.attempts < current.maxAttempts) {
      const base = options.baseRetryMs ?? 1_000;
      const delay = Math.min(base * 2 ** (current.attempts - 1), 30_000);
      return notify(transition(current, "retry_wait", now(), { failure, nextRetryAt: new Date(now().getTime() + delay).toISOString() }), options.onTransition);
    }
    return notify(transition(current, "failed", now(), { failure }), options.onTransition);
  }
}

export function requestProcessingRetry(job: ProcessingJob, at = new Date()): ProcessingJob {
  if (!(job.status === "retry_wait" || job.status === "failed" || job.status === "needs_ocr" || job.status === "cancelled" || job.status === "ready_for_ai")) {
    throw new Error(`A ${job.status} job cannot be queued again.`);
  }
  if (job.attempts >= job.maxAttempts && job.status !== "ready_for_ai" && job.status !== "needs_ocr") {
    throw new Error("Maximum processing attempts reached.");
  }
  return transition(job, "queued", at);
}

export interface AiHandoff {
  fileId: string;
  fileHash: string;
  pipelineVersion: typeof PROCESSING_PIPELINE_VERSION;
  adapterId: string;
  adapterVersion: string;
  sourceText: string;
  prompt: string;
  sanitizedFileName: string;
  strippedDelimiters: number;
}

/** Creates the only payload that may cross from local extraction into AI review. */
export function prepareAiHandoff(job: ProcessingJob, fileName: string): AiHandoff {
  if (job.status !== "ready_for_ai" || !job.artifact) throw new Error("Only a ready, sourced artifact can be handed to AI.");
  if (job.fileHash !== job.artifact.fileHash || job.fileId !== job.artifact.fileId) throw new Error("Artifact provenance no longer matches the processing job.");
  const wrapped = wrapUntrustedText({ fileName, text: job.artifact.text });
  return {
    fileId: job.fileId,
    fileHash: job.fileHash,
    pipelineVersion: PROCESSING_PIPELINE_VERSION,
    adapterId: job.artifact.adapterId,
    adapterVersion: job.artifact.adapterVersion,
    sourceText: wrapped.sanitizedText,
    prompt: wrapped.prompt,
    sanitizedFileName: wrapped.sanitizedFileName,
    strippedDelimiters: wrapped.strippedDelimiters,
  };
}
