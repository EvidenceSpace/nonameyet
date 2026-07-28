# Local image OCR

CaseFind treats image OCR as local extraction, not as an AI upload. PNG, JPEG, and WebP records can be offered to a local OCR runtime through the `local-image-ocr` adapter.

## Safety boundary

- The adapter reads original bytes from browser storage and never calls a network endpoint.
- File size is limited to 10 MB.
- Magic bytes must match the declared MIME type.
- Decoded dimensions are limited to 10,000 px per edge and 20 million pixels total.
- Cancellation never creates an artifact.
- Empty OCR output fails closed.
- Low-confidence output remains reviewable text with a warning.
- Successful OCR creates one provenance page tied to the file ID and SHA-256 hash.

The current concrete browser runtime uses the local Shape Detection `TextDetector` API when available. It never falls back to cloud OCR. Unsupported browsers receive a clear `adapter_unavailable` message stating that the image remained local. A universal version-pinned WebAssembly OCR engine remains a separate future slice.
