# Print-ready verified records

CaseFind’s downloadable report remains a self-contained HTML record. The report can be opened locally and saved as a PDF through the browser’s Print dialog without sending case data to a conversion service.

## Layout behavior

- A4 print dimensions and conservative margins are declared with paged-media CSS.
- The case identity, summary metrics, and review boundary form a cover section.
- Verified facts, source comparisons, checklist states, the source ledger, and product boundaries follow on subsequent pages.
- Fact cards, source excerpts, table rows, and final boundaries avoid page breaks where the browser supports it.
- Source-ledger headers repeat across printed pages.
- Screen-only instructions are removed from printed output.

## Important limits

Browser PDF engines may paginate fonts and long content differently. The user must review every generated page before sharing. CaseFind does not claim a downloaded PDF is authenticated, digitally signed, court-ready, or an unaltered original.

The report does not embed original image or PDF bytes. Amounts are displayed exactly as entered; CaseFind does not infer a currency.
