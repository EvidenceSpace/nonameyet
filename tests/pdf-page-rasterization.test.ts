import assert from "node:assert/strict";
import test from "node:test";
import { rasterizePdfPage } from "../web/pdf-page-rasterization.js";

function canvasFixture() {
  const context = { kind: "2d" };
  const canvas = { width: 0, height: 0, getContext: () => context };
  return { canvas, context };
}

test("rasterizes a PDF page on an opaque bounded canvas", async () => {
  const fixture = canvasFixture();
  let renderOptions;
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
    render(options: unknown) {
      renderOptions = options;
      return { promise: Promise.resolve() };
    },
  };
  const result = await rasterizePdfPage(page, {
    scale: 2,
    createCanvas(width: number, height: number) {
      fixture.canvas.width = width;
      fixture.canvas.height = height;
      return fixture.canvas;
    },
  });
  assert.deepEqual({ width: result.width, height: result.height }, { width: 1224, height: 1584 });
  assert.deepEqual(renderOptions, {
    canvasContext: fixture.context,
    viewport: { width: 1224, height: 1584 },
    background: "rgb(255, 255, 255)",
  });
  result.dispose();
  result.dispose();
  assert.deepEqual({ width: fixture.canvas.width, height: fixture.canvas.height }, { width: 0, height: 0 });
});

test("rejects oversized pages before allocating a canvas", async () => {
  let allocations = 0;
  const page = {
    getViewport: () => ({ width: 5_000, height: 5_000 }),
    render() { throw new Error("must not render"); },
  };
  await assert.rejects(() => rasterizePdfPage(page, {
    createCanvas() {
      allocations += 1;
      return canvasFixture().canvas;
    },
  }), (error: any) => error.code === "page_too_large");
  assert.equal(allocations, 0);
});

test("cancellation stops PDF.js rendering and releases the canvas", async () => {
  const fixture = canvasFixture();
  const controller = new AbortController();
  let cancelCalls = 0;
  const page = {
    getViewport: () => ({ width: 1_000, height: 1_000 }),
    render() {
      let rejectPromise: (error: Error) => void = () => {};
      const promise = new Promise<void>((_resolve, reject) => { rejectPromise = reject; });
      return {
        promise,
        cancel() {
          cancelCalls += 1;
          const error = new Error("cancelled");
          error.name = "RenderingCancelledException";
          rejectPromise(error);
        },
      };
    },
  };
  const work = rasterizePdfPage(page, {
    signal: controller.signal,
    createCanvas(width: number, height: number) {
      fixture.canvas.width = width;
      fixture.canvas.height = height;
      return fixture.canvas;
    },
  });
  controller.abort();
  await assert.rejects(work, (error: any) => error.name === "AbortError");
  assert.equal(cancelCalls, 1);
  assert.deepEqual({ width: fixture.canvas.width, height: fixture.canvas.height }, { width: 0, height: 0 });
});

test("invalid dimensions fail closed without allocation", async () => {
  let allocations = 0;
  await assert.rejects(() => rasterizePdfPage({
    getViewport: () => ({ width: Number.NaN, height: 100 }),
    render() { throw new Error("must not render"); },
  }, {
    createCanvas() {
      allocations += 1;
      return canvasFixture().canvas;
    },
  }), (error: any) => error.code === "corrupt_file");
  assert.equal(allocations, 0);
});
