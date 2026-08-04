import assert from "node:assert/strict";
import test from "node:test";
import { browserRasterTextDetectorRuntime } from "../web/raster-text-detector.js";

test("recognizes a rasterized PDF page directly in reading order", async () => {
  const source = { width: 1_224, height: 1_584 };
  let received;
  class Detector {
    async detect(value: unknown) {
      received = value;
      return [
        { rawValue: "Balance due", confidence: 0.8, boundingBox: { x: 10, y: 40 } },
        { rawValue: "Invoice 1042", confidence: 1, boundingBox: { x: 10, y: 10 } },
      ];
    }
  }
  const runtime = browserRasterTextDetectorRuntime({ TextDetector: Detector } as any)!;
  const result = await runtime.recognizeSource({ source });
  assert.equal(received, source);
  assert.deepEqual(result, {
    text: "Invoice 1042\nBalance due",
    confidence: 0.9,
    width: 1_224,
    height: 1_584,
  });
});

test("rejects oversized raster sources before text detection", async () => {
  let calls = 0;
  class Detector {
    detect() {
      calls += 1;
      return [];
    }
  }
  const runtime = browserRasterTextDetectorRuntime({ TextDetector: Detector } as any)!;
  await assert.rejects(
    () => runtime.recognizeSource({ source: { width: 10_001, height: 1 } }),
    (error: any) => error.code === "file_too_large",
  );
  assert.equal(calls, 0);
});

test("cancellation settles promptly when text detection is stalled", async () => {
  const controller = new AbortController();
  class Detector {
    detect() {
      return new Promise(() => {});
    }
  }
  const runtime = browserRasterTextDetectorRuntime({ TextDetector: Detector } as any)!;
  const started = performance.now();
  const pending = runtime.recognizeSource({
    source: { width: 100, height: 100 },
    signal: controller.signal,
  });
  setTimeout(() => controller.abort(), 10);
  await assert.rejects(pending, (error: any) => error.name === "AbortError");
  assert.ok(performance.now() - started < 500);
});

test("fails closed on malformed detector output", async () => {
  class Detector {
    async detect() {
      return [{ rawValue: 42 }];
    }
  }
  const runtime = browserRasterTextDetectorRuntime({ TextDetector: Detector } as any)!;
  await assert.rejects(
    () => runtime.recognizeSource({ source: { width: 100, height: 100 } }),
    (error: any) => error.code === "invalid_output",
  );
});

test("reports unavailable when native text detection is missing", () => {
  assert.equal(browserRasterTextDetectorRuntime({} as any), null);
});
