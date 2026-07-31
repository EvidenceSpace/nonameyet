# Backup recovery failure gate

The Chromium recovery lifecycle exercises both successful and unsuccessful restore paths against a real locally generated encrypted backup.

Before accepting the original backup, the lifecycle requires:

1. A wrong password to fail without navigation or partial restoration.
2. The password field to be cleared after failure.
3. A ciphertext-modified copy to fail with the same safe message.
4. The modified file to produce no partial restoration.
5. The untouched backup and correct password to restore the case successfully afterward.

Wrong passwords and damaged ciphertext deliberately share one error message so the interface does not expose unnecessary cryptographic details. All attempts remain local and make no external requests.
