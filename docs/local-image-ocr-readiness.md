# Local image OCR readiness

CaseFind V1 does not bundle a cross-browser OCR engine. Image text extraction currently depends on the browser exposing both on-device `TextDetector` and `createImageBitmap` capabilities. No OCR worker, language model, or trained-data file is fetched from a third party at runtime.

The case workspace now checks those capabilities before offering image OCR. When either capability is missing, the workspace does not start a processing job, does not show a retry action that cannot succeed, and does not create a misleading failed derivative. It identifies OCR as unavailable, explains that the original remains local, and keeps manual original review available.

This is a fail-closed product boundary rather than a claim of complete OCR support. Vendored, version-pinned OCR assets and scanned-PDF rasterization remain separate production work. Any future runtime must remain local, resource-bounded, cancellable, provenance-linked, and must never make extracted text user-confirmed automatically.
