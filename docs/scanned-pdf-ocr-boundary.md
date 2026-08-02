# Scanned PDF OCR boundary

The Chromium lifecycle verifies that an image-only PDF is never mistaken for a successfully extracted text document.

The gate requires:

1. A deterministic PDF with no selectable text is stored as a local original.
2. Local PDF.js inspection routes it to an explicit `OCR needed` state.
3. The workspace explains that the document has too little selectable text.
4. No extracted-text viewer or AI-analysis action appears without a valid text artifact.
5. The original PDF remains previewable with its exact SHA-256.
6. The OCR-needed state and original persist across reload.
7. No external request, provider call, account dependency, or synchronization occurs.

This boundary prevents image-only records from producing fabricated or empty evidence. Universal scanned-PDF OCR remains separate work and must preserve page-level provenance when introduced.
