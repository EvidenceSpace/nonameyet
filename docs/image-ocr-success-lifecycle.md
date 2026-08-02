# Successful local image OCR lifecycle

The Chromium lifecycle verifies the complete successful path from an explicitly uploaded image to reviewable local text.

The gate requires:

1. A deterministic browser OCR adapter reads the stored image locally.
2. Returned blocks are ordered by source position and normalized into stable text.
3. The source row reports that text is ready for review without claiming that facts are true.
4. The text viewer shows the filename, page, adapter version, exact text, and SHA-256 provenance.
5. The original remains separately previewable.
6. AI analysis remains an explicit user action and no verified fact is created automatically.
7. Extracted text and provenance persist across reload.
8. No external request, provider call, account dependency, or synchronization occurs.

This lifecycle covers the positive path without weakening the product boundary: local OCR produces a reviewable derivative, not authenticated evidence or automatically accepted facts.
