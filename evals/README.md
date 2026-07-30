# Synthetic extraction evaluation corpus

This directory contains fictional unpaid-freelance-payment records for measuring CaseFind’s text-extraction boundary without using customer data or making a paid provider request.

The initial corpus covers invoices, agreements, delivery and approval messages, tentative payment promises, negative payment evidence, and prompt-injection content. Each fixture defines exact expected candidates, source quotes, prohibited conclusions, and any injection rules that must be detected.

`src/ai/evaluation.ts` sends a candidate response through the same contract validation, quote grounding, confidence filtering, deduplication, and injection detection used by the product. It then measures exact semantic precision and recall against the fixture. A quote can therefore be grounded while the associated conclusion still counts as a false positive.

Reference outputs prove that the fixture and scoring machinery are internally consistent; they do not measure a model. Provider comparisons must run separately with explicit credentials and spending controls. Results should record provider, model, date, prompt and contract versions, latency, token usage, cost, fixture-level failures, micro precision, and micro recall.

The corpus is intentionally synthetic and narrow. Passing it does not establish legal correctness, authenticity, truth, fairness across languages, or production readiness. Before paid V1, it should expand with reviewed private or synthetic examples covering malformed extraction, scanned-document OCR, currencies, date formats, mixed languages, ambiguous approvals, partial payments, refunds, change requests, and adversarial text.
