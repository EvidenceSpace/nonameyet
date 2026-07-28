# Encrypted case backup

CaseFind cases remain local and are not synchronized merely because someone signs in. The encrypted backup feature lets a user preserve one complete case without sending it to CaseFind or any external service.

## Included data

- case details and checklist state;
- original uploaded record bytes and metadata;
- facts and exact provenance;
- unresolved and reviewed suggestions;
- local processing results.

## Encryption boundary

The browser serializes the case and encrypts it with AES-256-GCM. The encryption key is derived from a user-supplied password using PBKDF2-HMAC-SHA-256 with a random 128-bit salt and 310,000 iterations. Every backup uses a fresh 96-bit AES-GCM IV.

The cleartext envelope contains only the format version, KDF parameters, cipher parameters, salt, IV, and ciphertext. It contains no case title, filenames, facts, suggestions, extracted text, or original file bytes.

CaseFind does not receive, store, or recover the password. A minimum of 12 characters and explicit acknowledgment are required. The browser flow currently limits a backup to 50 MB of original bytes to avoid unstable memory use.

The first release creates and validates the encrypted portable format. Restore UI will be added separately with collision checks and transactional IndexedDB writes so failed imports cannot partially overwrite local cases.
