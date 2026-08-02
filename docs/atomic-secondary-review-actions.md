# Atomic secondary review actions

Marking a suggestion as uncertain and removing a confirmed fact change case activity and must remain truthful when browser storage fails.

For **Not sure**, CaseFind writes a copied suggestion with `status: uncertain` and updates case activity in one transaction. It does not mutate the in-memory suggestion before persistence succeeds.

For **Remove fact**, CaseFind deletes the fact and updates case activity in one transaction. The visible fact and its source provenance remain present until that transaction completes.

Injected-abort Chromium lifecycles verify that failure preserves the prior status or fact, keeps counts and timestamps stable, survives reload, produces no unhandled browser errors, and causes no external traffic.
