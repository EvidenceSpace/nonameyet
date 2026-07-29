# Honest intake privacy review

The intake privacy step describes only behavior implemented in V1.

Removed unsupported controls and claims:

- no seven-day automatic deletion preference, because V1 has no retention scheduler;
- no claim that the fixed unpaid-work checklist is tailored by the selected goal;
- no suggestion that informational privacy boundaries are configurable settings.

The review now states that local cases remain until the user deletes them or browser data is cleared, original bytes are not sent to AI, and text-only analysis requires separate explicit consent. Case creation requires a deliberate acknowledgment that browser-local data can be lost. The resulting case stores `localStorageAcknowledgedAt` as the time of that acknowledgment.

A regression test checks the shipped intake HTML for the supported language and rejects the removed automatic-deletion and tailored-checklist claims.
