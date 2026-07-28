# Encrypted case backup and restore

CaseFind cases remain local and are not synchronized merely because someone signs in. A user can preserve and recover one complete case without sending it to CaseFind or any external service.

## Included data

- case details and checklist state;
- original uploaded record bytes and metadata;
- facts and exact provenance;
- unresolved and reviewed suggestions;
- local processing results.

## Encryption boundary

The browser serializes the case and encrypts it with AES-256-GCM. The encryption key is derived from a user-supplied password using PBKDF2-HMAC-SHA-256 with a random 128-bit salt and 310,000 iterations. Every backup uses a fresh 96-bit AES-GCM IV. The cleartext envelope contains no case title, filename, fact, suggestion, extracted text, or original bytes.

## Restore safety

Restore decrypts locally and validates the complete payload before opening an IndexedDB write transaction. It checks format bounds, unique identifiers, case ownership, source relationships, byte length, SHA-256 integrity, and size limits. All stores are written in one transaction. Existing case IDs and record collisions reject the entire operation; restore never overwrites or partially imports local data.
