# Timeline storage failure recovery

Source-linked timeline events are user-entered records with exact local source provenance. A failed write must never appear successful or erase the user’s draft.

Create and edit failures keep the event dialog open, preserve every entered field, restore the correct action label, and state that no stored value changed. Editing failure retains the original event, revision, provenance, and case activity timestamp.

Removal remains a two-step action. If its IndexedDB transaction aborts, the event and case activity timestamp remain unchanged, the confirmation state resets to **Remove**, and an accessible message appears inside the affected event card. A retry therefore requires a fresh explicit confirmation.

The lifecycle coverage injects transaction aborts into event creation, editing, and deletion; verifies IndexedDB and reload state; and checks for external traffic and unhandled browser errors.
