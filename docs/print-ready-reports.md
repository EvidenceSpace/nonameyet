# Print-ready verified records

CaseFind’s downloadable report remains a self-contained HTML record. The report can be opened locally and saved as a PDF through the browser’s Print dialog without sending case data to a conversion service.

## Layout behavior

- A4 print dimensions and conservative margins are declared with paged-media CSS.
- The case identity, summary metrics, and review boundary form a cover section.
- Verified facts, source comparisons, checklist states, the source ledger, and product boundaries follow on subsequent pages.
- Fact cards, source excerpts, table rows, and final boundaries avoid page breaks where the browser supports it.
- Source-ledger headers repeat across printed pages.
- Screen-only instructions are removed from printed output.

## Browser quality gate

The Chromium lifecycle creates a synthetic local case, opens the real export preflight, previews the self-contained report in a new tab, switches to print media, and renders an A4 PDF buffer. It requires the report to remain script-free, retain its restrictive content security policy, avoid external requests, hide screen-only guidance from print, preserve the entered amount without adding a currency, and produce a non-empty PDF document.

This gate validates the export path and browser rendering behavior. It does not claim that every operating system, browser version, printer driver, font, or user-selected print setting will paginate identically.

## Important limits

Browser PDF engines may paginate fonts and long content differently. The user must review every generated page before sharing. CaseFind does not claim a downloaded PDF is authenticated, digitally signed, court-ready, or an unaltered original.

The report does not embed original image or PDF bytes. Amounts are displayed exactly as entered; CaseFind does not infer a currency.
