# Backup restore collision gate

The encrypted recovery lifecycle now attempts to restore a valid backup while the original local case still exists.

The restore must:

- reject the operation before opening a write transaction;
- state that the case already exists and nothing was overwritten;
- remain on the restore screen;
- clear the password field;
- leave the existing workspace and case title unchanged.

Only after the original case is deliberately deleted may the same untouched backup restore successfully. This browser gate complements the transactional collision checks for included records and prevents backup import from becoming an accidental overwrite mechanism.
