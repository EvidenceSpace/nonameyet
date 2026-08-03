# Scanned-PDF recovery boundary

PDF.js extracts selectable text locally. When a PDF has fewer than 20 non-whitespace characters, CaseFind treats it as a scanned or low-text PDF and stops before any AI action.

CaseFind does not currently rasterize and OCR PDF pages. The workspace keeps the original available for manual review, does not offer a retry that would repeat the same result, and does not expose extracted-text or AI-analysis actions.

When local image OCR is available, the recovery guidance suggests exporting only the pages needed as PNG or JPEG and adding those images as separate records. This is explicit, data-minimizing, and local. When image OCR is unavailable too, the workspace says so instead of suggesting an action that cannot succeed.

Future scanned-PDF OCR must use vendored, version-pinned assets; process bounded pages locally; remain cancellable; preserve page-level provenance; and never make extracted text user-confirmed automatically.
