# Local PDF cancellation boundary

The case workspace exposes a Cancel action while selectable PDF text is being extracted. Cancellation now propagates into the browser PDF pipeline instead of changing only the interface.

The pipeline checks cancellation before reading the original, before starting PDF.js, after document loading, before each page, after each page text operation, and before creating an extraction artifact. Pending loading and page operations race the cancellation signal so the workspace can settle promptly even if an underlying PDF.js promise is slow.

On cancellation, CaseFind destroys the PDF.js loading task when available, cleans up the active page, destroys the document, persists a `cancelled` processing state, and creates no extracted-text artifact or AI action. The untouched original remains stored locally and can be retried explicitly.
