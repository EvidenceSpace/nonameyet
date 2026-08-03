# Local image OCR quality

Image OCR results now carry structured, review-oriented quality metadata: normalized confidence, a `high`, `medium`, `low`, or `unknown` level, and an explicit `reviewRequired` flag. Confidence is accepted only when it is finite and between 0 and 1.

TextDetector block confidence values are averaged when the browser provides them. Missing or invalid confidence is labeled **OCR confidence unavailable** rather than guessed. Low and medium confidence add targeted warnings; unknown confidence adds a conservative review warning. Even high-confidence output remains review-only.

The extracted-text viewer displays the confidence label beside adapter provenance and continues to require comparison with the original. Quality metadata never authenticates a document, determines truth, or bypasses human review.
