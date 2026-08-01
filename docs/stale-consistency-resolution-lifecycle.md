# Stale consistency resolution lifecycle

The Chromium lifecycle verifies that a prior consistency decision is never carried forward after the participating verified facts change.

The gate requires:

1. Two source-linked agreed-price facts create an unresolved comparison.
2. The user can review both values as contextual and add a local note.
3. Adding a third participating value invalidates the prior derived comparison.
4. The new comparison returns to unresolved and includes all current values.
5. The prior review note is not presented as resolving the changed facts.
6. All originals and verified facts remain intact.
7. The reopened state persists across reload.

This fail-closed behavior prevents an old decision from silently approving a materially changed source set. It remains an organizational review, not a truth or authenticity judgment.
