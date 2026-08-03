# Local image OCR output limits

CaseFind bounds local image OCR output before normalization, joining, or persistence. This protects the browser and local database from unexpectedly dense, malformed, or compromised OCR runtime output while retaining the explicit local original.

Limits:

- 200,000 extracted characters
- 10,000 detected text blocks
- 20 runtime warnings
- 500 characters per runtime warning
- 100 characters each for adapter identity and version metadata

Exceeding a size or count limit is a permanent `output_too_large` failure for that image and creates no extraction artifact or AI action. Malformed adapter results use the safe, retryable `invalid_output` classification and never expose raw runtime details. The bitmap is closed even when block validation fails. A successful result still passes the complete extraction-artifact integrity boundary before the UI trusts it.
