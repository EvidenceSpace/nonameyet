# Checklist storage rollback

Checklist status is user-controlled organization state. The interface must never show a category as found, missing, uncertain, or not applicable unless that exact status was saved locally.

The checklist UI computes the proposed record without mutating the prior record, disables selectors while saving, and updates visible metrics optimistically only inside a temporary saving render. If IndexedDB rejects or aborts the write, it restores the previous record, selector value, row state, and readiness metric and displays a truthful failure message.

The Chromium lifecycle injects an abort into the case write and verifies rollback in the selector, row, metric, IndexedDB record, and reload state, with no external traffic or unhandled browser error.
