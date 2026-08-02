# Resilient case library actions

Archive, restore, and permanent deletion change whether a complete local case is visible or available. The case hub treats each operation as committed only after IndexedDB completes its transaction.

Archive and restore failures keep the case in its prior view, preserve timestamps and counts, restore the action label, and show an accessible card-local status. The failure callout uses restrained error styling that remains legible without motion or color alone.

Permanent deletion spans cases, originals, facts, suggestions, processing jobs, and events in one transaction. The failure lifecycle aborts that transaction during case deletion and verifies that the complete bundle remains present, the confirmation dialog stays open with a truthful error, and reload retains the case.

All case-hub failure lifecycles assert no external traffic and no unhandled browser errors.
