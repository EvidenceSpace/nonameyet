# Atomic manual fact creation

A manually entered fact and the case activity timestamp commit in one IndexedDB transaction. The workspace must not clear the form or claim success until that transaction completes.

On storage failure, CaseFind keeps the fact dialog open with the user's type, value, note, and source selection intact. It creates no fact, does not change case activity, and presents a retryable local-storage message. Source provenance continues to use the selected original's file ID and SHA-256.

The Chromium lifecycle injects an abort during the case activity update and verifies no partial fact, preserved draft fields, unchanged activity, reload persistence of the pre-attempt state, no unhandled browser errors, and no external traffic.
