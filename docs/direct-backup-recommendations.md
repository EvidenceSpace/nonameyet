# Direct backup recommendations

When the local case hub recommends creating or refreshing an encrypted backup, the recommendation links directly to the case backup preparation dialog instead of dropping the user at the top of the workspace.

The `#backup` URL fragment is treated as an explicit local UI intent. CaseFind removes the fragment before opening the dialog so refreshes do not repeatedly reopen it. The dialog still requires a password of at least 12 characters, matching confirmation, and explicit acknowledgment before encryption can begin.

Opening the recommendation does not create, upload, or download anything automatically. Backup preparation continues to load case data from the browser and encryption remains a separate user-confirmed action.
