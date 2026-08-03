# Local storage startup recovery

If the case library cannot open IndexedDB, it must distinguish a temporarily blocked schema upgrade from a general browser-storage failure. Neither state implies that local cases are gone.

For a blocked upgrade, CaseFind explains that another open tab is preventing a safe migration, confirms that cases were not changed, and asks the user to close other CaseFind tabs before retrying. It explicitly warns against clearing site data.

For other open failures, CaseFind confirms that nothing was changed or deleted, suggests checking browser storage permissions and available device space, and again warns against clearing site data when existing cases matter.

Both states provide a 44-pixel retry action, an accessible alert, an announced retry status, and a non-destructive route back home. Retrying reuses the normal case-loading path and never calls database deletion or reset APIs.
