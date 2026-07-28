# Verified case report export

CaseFind generates a self-contained, print-ready HTML report entirely in the browser.

## Inclusion rules

- Include only facts with `confirmed` or `corrected` status.
- Require a source record and a matching SHA-256 value when the fact carries a source hash.
- Exclude suggested, uncertain, dismissed, missing-source, and hash-mismatched facts.
- Count unresolved suggestions without including their labels, values, quotes, or other content.
- Include source metadata and hashes, but never original file bytes.

The report escapes user-controlled content and applies `default-src 'none'`. It has no scripts, remote images, external stylesheets, or network dependencies. Users can open the HTML locally and use Print to save a PDF.
