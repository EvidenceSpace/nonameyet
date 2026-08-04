import assert from "node:assert/strict";
import test from "node:test";
import { ocrPdfPage } from "../web/pdf-page-ocr.js";

function fixture() {
  const source = { width: 1_224, height: 1_584 };
  let disposals = 0;
  return {
    source,
    raster: {
      source,
      width: source.width,
      height: source.height,
      dispose() { disposals += 1; },
    },
    disposals: () => disposals,
  };
}

const runtime = (recognizeSource: (input: any) => unknown) => ({
  id: "text-detector-raster",
  version: "1",
  recognizeSource,
});

test("orchestrates rasterization, normalized OCR, provenance, and cleanup", async () => {
  const item = fixture();
  let receivedSignal;
  const result = await ocrPdfPage({}, {
    rasterize: async (_page: unknown, { signal }: { signal: AbortSignal }) => {
      receivedSignal = signal;
      return item.raster;
    },
    runtime: runtime(async ({ source, signal }) => {
      assert.equal(source, item.source);
      assert.equal(signal, receivedSignal);
      return {
        text: " Invoice\u0000 1042  \r\nBalance due\t ",
        width: 1_224,
        height: 1_584,
        confidence: 0.9,
      };
    }),
  });
  assert.deepEqual(result, {
    text: "Invoice 1042\nBalance due",
    confidence: 0.9,
    width: 1_224,
    height: 1_584,
    adapterId: "pdf-page-ocr",
    adapterVersion: "1.0.0+text-detector-raster-1",
  });
  assert.equal(item.disposals(), 1);
});

test("timeout aborts stalled recognition and releases the raster", async () => {
  const item = fixture();
  let workAborted = false;
  const result = ocrPdfPage({}, {
    timeoutMs: 10,
    rasterize: async () => item.raster,
    runtime: runtime(({ signal }) => new Promise((resolve) => {
      signal.addEventListener("abort", () => {
        workAborted = true;
        resolve({ text: "late" });
      }, { once: true });
    })),
  });
  await assert.rejects(result, (error: any) => error.code === "ocr_timeout");
  assert.equal(workAborted, true);
  assert.equal(item.disposals(), 1);
});

test("external cancellation remains cancellation and releases the raster", async () => {
  const item = fixture();
  const controller = new AbortController();
  const pending = ocrPdfPage({}, {
    signal: controller.signal,
    timeoutMs: 1_000,
    rasterize: async () => item.raster,
    runtime: runtime(() => new Promise(() => {})),
  });
  setTimeout(() => controller.abort(), 10);
  await assert.rejects(pending, (error: any) => error.name === "AbortError");
  assert.equal(item.disposals(), 1);
});

test("late raster completion after timeout is disposed", async () => {
  const item = fixture();
  let resolveRaster: (value: any) => void = () => {};
  const pending = ocrPdfPage({}, {
    timeoutMs: 10,
    rasterize: () => new Promise((resolve) => { resolveRaster = resolve; }),
    runtime: runtime(async () => ({ text: "unused", width: 1_224, height: 1_584 })),
  });
  await assert.rejects(pending, (error: any) => error.code === "ocr_timeout");
  resolveRaster(item.raster);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(item.disposals(), 1);
});

test("mismatched output dimensions fail closed and release the raster", async () => {
  const item = fixture();
  await assert.rejects(() => ocrPdfPage({}, {
    rasterize: async () => item.raster,
    runtime: runtime(async () => ({ text: "Invoice", width: 100, height: 100 })),
  }), (error: any) => error.code === "invalid_output");
  assert.equal(item.disposals(), 1);
});
