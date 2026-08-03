# New-case storage recovery

Case creation keeps one stable draft identity across retries. If local storage rejects a save, the entered title, client, amount, summary, goal, and storage acknowledgement remain in the open form. Retrying updates the same pending record identity rather than generating another case ID.

Blocked database upgrades are distinguished from general storage unavailability. Blocked upgrades tell the user to close other CaseFind tabs. General failures point to browser storage permissions and device capacity. Both states confirm that entries remain visible, avoid claiming that a case was saved, and warn against clearing site data.

The creation form remains the source of truth until its IndexedDB transaction completes. The success state and workspace link are shown only after that completion. While saving, the form is marked busy and the create action is disabled. After failure, the error surface receives focus and the primary action becomes an explicit safe retry.
