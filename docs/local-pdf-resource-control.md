# Local PDF resource control

CaseFind bounds local PDF extraction independently of upload intake so restored or legacy records cannot bypass current safety limits.

- Maximum PDF bytes processed: 20 MB.
- Maximum pages: 500.
- Maximum selectable text retained: 2,000,000 characters.
- Maximum extraction runtime: 60 seconds.

Declared oversized files fail before CaseFind reads the original or starts PDF.js. The byte length is checked again after reading. Text is counted while each page is assembled, before it can be added to an extraction artifact. The deadline cancels in-flight PDF.js work and destroys available task, page, and document resources.

Every boundary fails closed: the untouched local original remains available, and no extracted-text artifact or AI action is created. Oversized or over-text PDFs require an explicit smaller replacement. Timeouts permit one user-directed retry and recommend splitting the PDF if the retry also stalls.
