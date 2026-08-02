# Extraction warning review

Extraction warnings must remain visible wherever users inspect derived source text.

The Chromium lifecycle stores deterministic local text with a low-confidence warning and requires:

1. The source row reports that text is ready for review without claiming correctness.
2. Opening the text viewer displays the warning beside the extracted content.
3. Filename, adapter version, page number, exact text, and SHA-256 provenance remain available.
4. The warning is not hidden by reload or by the successful processing status.
5. No fact is created or verified automatically.
6. No external request, provider call, account dependency, or synchronization occurs.

Warnings are part of the extraction artifact, not decorative copy. Future OCR adapters can report blur, rotation, low confidence, partial-page coverage, language uncertainty, or other limitations through the same review surface.
