# Local PDF signature preflight

A browser-supplied MIME type and filename are metadata, not proof that stored bytes are a PDF. Before CaseFind starts PDF.js, it searches only the first 1,024 bytes for the `%PDF-` header permitted near the beginning of a conforming PDF.

Empty files, renamed text, and other mislabeled bytes fail permanently with **Needs attention**. The original remains stored locally for inspection, but CaseFind does not pass those bytes to PDF.js, create extracted text, or expose an AI-analysis action. Recovery asks the user to verify the format and explicitly add a genuine PDF.

The scan is deliberately bounded. A `%PDF-` sequence after the first 1,024 bytes does not satisfy the preflight. Passing the header check is not treated as proof that the rest of the document is valid; PDF.js still parses with strict error handling and existing malformed-file recovery.
