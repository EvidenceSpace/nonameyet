# Workspace startup and local-storage boundary

The case workspace now separates two different startup outcomes: a case that is not present on this device and a browser database that could not be opened safely.

A missing case is not presented as a storage failure. The workspace explains that the case may have been deleted, created in another browser, or removed with site data, and confirms that CaseFind did not create or change records. Destructive controls are hidden and navigation points back to the local case library.

A storage failure uses the shared blocked/unavailable recovery states with workspace-specific language and a safe retry. The skip link follows the visible recovery surface, and the delete-case control remains hidden.

Workspace feature modules now load only after the base case record and related data render successfully. Processing, reporting, backup, case-detail, deletion, timeline, consistency, and readiness modules therefore do not start against a blocked or unavailable database. This prevents cascaded failures and keeps recovery focused on the original storage problem.
