# Report private-data boundary

CaseFind reports exclude private fact notes and source-comparison notes by default. These fields appear only when the user explicitly enables the corresponding option in the export preflight for that report.

The browser lifecycle verifies the complete boundary:

1. Create a synthetic case and local source record.
2. Add a source-linked verified fact containing a private note.
3. Preview the default report and require the note to be absent.
4. Explicitly enable private fact notes.
5. Preview again and require the note to be present, escaped, and inert.
6. Require the source SHA-256 reference to remain attached.
7. Fail on external requests or browser runtime errors.

Opting in affects only the report being generated. It does not change the default for later exports. Included notes remain user-provided context; CaseFind does not authenticate or independently verify them.
