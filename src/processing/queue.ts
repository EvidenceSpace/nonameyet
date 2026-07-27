import { runProcessingJob, type RunProcessingOptions } from "./pipeline.js";
import { PROCESSING_PIPELINE_VERSION, type ProcessingJob, type ProcessingQueueItem } from "./types.js";

export function processingIdentity(item: ProcessingQueueItem): string {
  return `${item.file.id}:${item.file.sha256}:${PROCESSING_PIPELINE_VERSION}`;
}

/** Keeps the first identical file/hash/pipeline job and drops accidental duplicates. */
export function deduplicateQueue(items: readonly ProcessingQueueItem[]): ProcessingQueueItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const identity = processingIdentity(item);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export async function runProcessingQueue(args: {
  items: readonly ProcessingQueueItem[];
  concurrency?: number;
  options: RunProcessingOptions;
  onJobComplete?: (job: ProcessingJob) => void;
}): Promise<ProcessingJob[]> {
  const items = deduplicateQueue(args.items);
  const concurrency = Math.max(1, Math.min(Math.floor(args.concurrency ?? 2), 4));
  const results = new Array<ProcessingJob>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (!item) return;
      const result = await runProcessingJob(item.job, item.file, args.options);
      results[index] = result;
      args.onJobComplete?.(result);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
