# Report consistency disclosure lifecycle

The Chromium report lifecycle verifies that source comparisons remain transparent without leaking private review notes by default.

The gate requires:

1. An unresolved verified source comparison is counted in export preflight.
2. The downloaded report discloses the unresolved state and preserves every participating value and source name.
3. After a user selects one value, the report marks that value without hiding the alternative.
4. A user-entered comparison note stays excluded by default.
5. The note appears only after a separate explicit export opt-in.
6. No original bytes, provider calls, external requests, or synchronization are introduced.

Reports organize source-linked decisions; they do not authenticate records, determine truth, provide legal advice, or predict outcomes.
