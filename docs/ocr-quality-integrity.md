# OCR quality integrity boundary

Stored OCR confidence is review metadata, not evidence of authenticity or truth. CaseFind now validates it whenever a ready extraction is restored or rendered.

The quality object must keep `reviewRequired: true`; use a finite confidence between 0 and 1 or explicit `null`; match the derived `high`, `medium`, `low`, or `unknown` level; and retain the warning required by that confidence band. Missing quality remains valid for extraction artifacts created before quality metadata was introduced.

If quality metadata is malformed or internally inconsistent, the complete extraction fails closed as invalid. CaseFind hides extracted text and AI-analysis actions and asks the user to process the unchanged local original again. This prevents corrupted or restored state from presenting low confidence as high confidence or suppressing required review warnings.
