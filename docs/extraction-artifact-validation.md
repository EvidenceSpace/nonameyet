# Extraction artifact validation boundary

A stored extraction is a derivative of an original record. It is reviewable only when its internal structure, provenance metadata, and resource bounds are coherent.

The shared browser validator requires:

1. One to 500 pages with unique positive page numbers.
2. At least one non-whitespace character and no more than 200,000 page characters.
3. Non-empty, bounded adapter ID and adapter version values.
4. Combined artifact text that exactly matches the ordered page text.
5. When source ranges are present, exact contiguous offsets into the combined text.
6. At most 100 non-empty warnings, with 1,000 characters per warning and 20,000 warning characters in total.

The case workspace applies this complete validator before exposing **View text** or **Find details**. A derivative whose pages appear readable but whose combined text, ranges, warning metadata, adapter provenance, case ownership, or original-file hash is inconsistent is marked failed and can only be regenerated from the preserved original.

Analysis consent is not enough to bypass this boundary. Invalid artifacts are rejected before session or provider traffic. Backup restore also validates ready artifacts and their original-file hash before persistence, preventing malformed or mismatched derivatives from being reintroduced through an encrypted backup.

Original bytes remain authoritative. Rejected derivatives can be regenerated from the preserved local original; they must never be repaired by guessing.
