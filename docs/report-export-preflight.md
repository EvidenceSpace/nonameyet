# Report export preflight

Before generating a report, CaseFind shows counts for verified facts, referenced sources, unresolved suggestions, and incomplete facts.

Users explicitly choose whether to include the case summary, private fact notes, source quotes, and collection checklist. Private notes are disabled by default. Verified values, verification labels, source filenames, source locators, SHA-256 hashes, and product boundaries remain mandatory so the report cannot appear sourced while hiding its provenance.

Both preview and download rebuild from current IndexedDB data. Unresolved suggestion content and incomplete facts stay excluded regardless of settings. Preview uses a temporary local Blob URL, and generated reports retain the no-network Content Security Policy.
