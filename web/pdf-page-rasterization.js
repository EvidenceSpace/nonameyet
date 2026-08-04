export const PDF_OCR_RENDER_SCALE = 2;
export const MAX_PDF_OCR_PAGE_EDGE = 4_096;
export const MAX_PDF_OCR_PAGE_PIXELS = 16_000_000;

function rasterError(message, code) {
  return Object.assign(new Error(message), { code });
}

function abortError() {
  return new DOMException("cancelled", "AbortError");
}

function defaultCanvasFactory(width, height, scope = globalThis) {
  if (typeof scope.OffscreenCanvas === "function") return new scope.OffscreenCanvas(width, height);
  const canvas = scope.document?.createElement?.("canvas");
  if (!canvas) throw rasterError("Canvas rendering is unavailable.", "adapter_unavailable");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function releaseCanvas(canvas) {
  try {
    canvas.width = 0;
    canvas.height = 0;
  } catch {}
}

export async function rasterizePdfPage(page, {
  signal,
  scale = PDF_OCR_RENDER_SCALE,
  maxEdge = MAX_PDF_OCR_PAGE_EDGE,
  maxPixels = MAX_PDF_OCR_PAGE_PIXELS,
  createCanvas = defaultCanvasFactory,
} = {}) {
  if (!page || typeof page.getViewport !== "function" || typeof page.render !== "function") {
    throw rasterError("PDF page renderer is invalid.", "invalid_output");
  }
  if (!Number.isFinite(scale) || scale <= 0) {
    throw rasterError("PDF render scale is invalid.", "invalid_output");
  }
  if (signal?.aborted) throw abortError();

  const viewport = page.getViewport({ scale });
  const width = Math.ceil(viewport?.width);
  const height = Math.ceil(viewport?.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw rasterError("PDF page dimensions are invalid.", "corrupt_file");
  }
  if (width > maxEdge || height > maxEdge || width * height > maxPixels) {
    throw rasterError("PDF page dimensions exceed the local OCR limit.", "page_too_large");
  }

  const canvas = createCanvas(width, height);
  const context = canvas?.getContext?.("2d", { alpha: false });
  if (!context) {
    releaseCanvas(canvas);
    throw rasterError("Canvas rendering is unavailable.", "adapter_unavailable");
  }

  let renderTask;
  let settled = false;
  const handleAbort = () => {
    if (settled) return;
    try { renderTask?.cancel?.(); } catch {}
  };
  signal?.addEventListener("abort", handleAbort, { once: true });
  try {
    if (signal?.aborted) throw abortError();
    renderTask = page.render({
      canvasContext: context,
      viewport,
      background: "rgb(255, 255, 255)",
    });
    await renderTask.promise;
    if (signal?.aborted) throw abortError();
    settled = true;
    let disposed = false;
    return {
      source: canvas,
      width,
      height,
      dispose() {
        if (disposed) return;
        disposed = true;
        releaseCanvas(canvas);
      },
    };
  } catch (error) {
    releaseCanvas(canvas);
    if (signal?.aborted || error?.name === "RenderingCancelledException") throw abortError();
    throw error;
  } finally {
    settled = true;
    signal?.removeEventListener("abort", handleAbort);
  }
}
