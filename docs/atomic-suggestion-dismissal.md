# Atomic suggestion dismissal

Dismissing an AI suggestion removes a pending review item and updates case activity. Both changes must commit together so a storage failure cannot hide a suggestion only in the current UI.

The existing IndexedDB deletion boundary spans `suggestions` and `cases`. The review UI now waits for that transaction to complete before removing the card. On failure it preserves the pending suggestion, count, and case timestamp and presents a retryable message.

The Chromium lifecycle injects an abort during the case activity update and verifies that the suggestion remains `suggested`, survives reload, creates no fact, produces no unhandled browser error, and causes no external traffic.
