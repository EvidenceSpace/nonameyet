import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { browserTextDetectorRuntime, processImage } from "../web/image-ocr.js";

const png = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]);
const file = { id: "file-1", caseId: "case-1", sha256: createHash("sha256").update(png).digest("hex"), type: "image/png", size: png.length, original: { async arrayBuffer() { return png.buffer; } } };
const boundedTimeoutMs = 250;

function hangingRuntime(state: { closed: boolean; resolve?: (value: unknown) => void }) {
  return browserTextDetectorRuntime({
    TextDetector: class { detect() { return new Promise((resolve) => { state.resolve = resolve; }); } },
    async createImageBitmap() { return { width: 100, height: 100, close() { state.closed = true; } }; },
  })!;
}

test("timeout actively closes the bitmap and ignores a hanging detector", async () => {
  const state = { closed: false };
  const result = await processImage(file, { runtime: hangingRuntime(state), timeoutMs: boundedTimeoutMs });
  assert.deepEqual(result.failure, { code: "ocr_timeout", retryable: true }); assert.equal(result.artifact, undefined); assert.equal(state.closed, true);
});

test("user cancellation actively closes the bitmap", async () => {
  const state = { closed: false };
  const controller = new AbortController();
  const pending = processImage(file, { runtime: hangingRuntime(state), signal: controller.signal, timeoutMs: 1_000 });
  await new Promise((resolve) => setTimeout(resolve, 0)); controller.abort();
  const result = await pending;
  assert.equal(result.status, "cancelled"); assert.deepEqual(result.failure, { code: "cancelled", retryable: false }); assert.equal(state.closed, true);
});

test("late detector completion cannot replace a timed-out result", async () => {
  const state = { closed: false };
  const result = await processImage(file, { runtime: hangingRuntime(state), timeoutMs: boundedTimeoutMs });
  state.resolve?.([{ rawValue: "Late text", boundingBox: { x: 0, y: 0 } }]);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(result.failure, { code: "ocr_timeout", retryable: true }); assert.equal(result.artifact, undefined); assert.equal(state.closed, true);
});

test("timeout aborts the runtime work signal", async () => {
  let aborted = false;
  const runtime = { id: "test", version: "1", recognize({ signal }: { signal: AbortSignal }) { return new Promise((resolve) => signal.addEventListener("abort", () => { aborted = true; resolve({ text: "Late", width: 1, height: 1 }); }, { once: true })); } };
  const result = await processImage(file, { runtime, timeoutMs: boundedTimeoutMs });
  assert.equal(aborted, true); assert.deepEqual(result.failure, { code: "ocr_timeout", retryable: true }); assert.equal(result.artifact, undefined);
});
