const EXPECTED_VERSION = "4.10.38";
let runtimePromise;

export async function loadLocalPdfEngine() {
  runtimePromise ??= import("./vendor/pdfjs/pdf.mjs").then((runtime) => {
    if (runtime.version !== EXPECTED_VERSION) {
      throw new Error(`Unexpected PDF.js version ${runtime.version || "unknown"}; expected ${EXPECTED_VERSION}.`);
    }
    runtime.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.mjs", import.meta.url).href;
    return runtime;
  });
  return runtimePromise;
}

export async function localPdfEngineStatus() {
  try {
    const runtime = await loadLocalPdfEngine();
    return { available: true, version: runtime.version };
  } catch (error) {
    return { available: false, message: error instanceof Error ? error.message : "Local PDF engine unavailable." };
  }
}
