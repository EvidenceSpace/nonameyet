# PDF structure quality gate

The Chromium report lifecycle inspects the bytes of the locally rendered PDF in addition to checking that the preview is inert.

The gate requires:

- a valid PDF version header;
- a terminal `startxref` and `%%EOF` structure;
- a non-trivial byte size;
- a bounded two-to-three-page result for the fixed synthetic report;
- no PDF encryption dictionary;
- no JavaScript action;
- no document-open action;
- no embedded-file collection.

The bounded page count is a regression guard for accidental extra or blank pages in this fixed fixture. It is not a promise that every user report will have the same page count, nor does structural inspection prove that every rendered page contains visible content. Cross-browser and printer pagination can still vary.
