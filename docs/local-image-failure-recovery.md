# Local image OCR failure recovery

CaseFind classifies local image OCR failures before displaying them. Permanent failures—unsupported format, oversized input, mismatched or damaged bytes, unavailable adapter, and no readable text—show **Needs attention**, preserve the original locally, and remove ineffective retry and AI actions.

Timeouts and unknown operational failures remain safely retryable. Internal decoder, browser, and OCR runtime details are replaced with stable recovery guidance so implementation details are not exposed to the interface.

An adapter-unavailable result may become actionable if browser capabilities later appear; readiness is re-evaluated before exposing a retry. No failure path creates extracted text, facts, or AI suggestions.
