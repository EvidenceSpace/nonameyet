# Timeline provenance editing

## Purpose

Make the manual timeline genuinely editable while strengthening the connection between each user-entered event and the exact original record location that supports it.

## Behavior

- Users can create and edit event date, title, description, source record, optional PDF page, and optional exact excerpt.
- Editing preserves the event ID, case ID, origin, and creation timestamp.
- Each successful edit increments a local revision number and refreshes the update timestamp.
- Changing the source refreshes the stored SHA-256 reference from the selected local record.
- Page numbers are accepted only for PDF sources and must be integers from 1 through 10,000.
- Excerpts are optional, user-entered, and limited to 500 characters.
- Timeline cards show the source filename, locator, full hash, and a fail-closed source-integrity status.
- Open source uses the existing local preview, opens the selected PDF page when available, and displays the saved excerpt.
- Missing sources or hash mismatches disable source opening and remain excluded from reports.
- Reports include timeline locators and, only when source excerpts are enabled, saved timeline excerpts.

## Trust boundary

A source link shows which local record and location the user associated with an event. It does not authenticate the record, prove that the event occurred, or verify that an excerpt is accurate. Users must compare timeline entries with the original record before relying on or sharing a report.

## Privacy

Timeline data, locators, excerpts, and edits stay in the local case database. Opening a source uses the local original bytes. No new network request, account permission, synchronization, or AI processing is introduced.
