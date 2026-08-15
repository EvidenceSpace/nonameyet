# CaseFind local product review

This guide is for the integration branch `integration/local-review-20260815`.
It is a reality-review build, not a merge candidate and not a production release.

## What this branch contains

- The exact-current, source-linked timeline candidate from PR #86.
- The first-run and intake visual foundation from PR #89.
- The local case-library visual foundation from PR #90.
- A published TypeScript dependency pin from PR #87 so the requested version exists.
- No automatic upload, synchronization, mailbox access, or background collection.

This branch deliberately does **not** include the unfinished exact-current case-record mutation prototype. Checklist, case-detail, archive, backup-metadata, and deletion transitions still require the coordinated UI migration described in `docs/PRODUCT_REALITY_SCORECARD.md`.

## Safety before testing

Use synthetic records only. Do not use a real client name, real invoice, real messages, or any sensitive personal document in this review build.

Case data and uploaded originals are stored in the browser profile used for testing. Clearing that profile or its site data removes the local case unless you have manually created an encrypted backup.

## Requirements

- Node.js 22, 23, or 24
- npm
- Python 3
- Chromium or Chrome for the primary review

## Install and start

```bash
git clone https://github.com/EvidenceSpace/nonameyet.git
cd nonameyet
git checkout integration/local-review-20260815
npm install --ignore-scripts --no-audit --no-fund --package-lock=false
npm run preview
```

Open `http://127.0.0.1:4173/index.html`.

If PDF.js assets need to be refreshed separately, run `npm run sync:pdfjs` before `npm run preview`.

## Reality-review path

Use a new browser profile or Incognito window so prior IndexedDB content cannot hide first-run problems.

1. **Home**
   - Review the first viewport at desktop and 390 px mobile width.
   - Confirm the product promise, local-storage boundary, and primary action are understandable without reading every paragraph.
   - Treat the case card as marketing example data, not a generated assessment.
2. **Create a case**
   - Use a synthetic title such as `Northstar Studio website payment`.
   - Enter a fictional client, amount, and a 30+ character description.
   - Complete the goal and privacy-review steps.
   - Confirm that the acknowledgment is required and that failures preserve form content.
3. **Library**
   - Return to `cases.html`.
   - Test search, case counts, open, archive/restore, backup state, and delete confirmation.
   - Check the empty, no-results, archived, loading, and failure states where possible.
4. **Workspace**
   - Upload only a small synthetic PNG or PDF selected explicitly through the file picker.
   - Confirm that the original stays available, local extraction is visible, and no AI request occurs without a separate consent action.
   - Review checklist, source viewer, suggestions, consistency, timeline, readiness, and report sections.
5. **Timeline**
   - Add a manual event linked to the synthetic source.
   - Try duplicate clicks, editing after changing/removing a source, canceling an in-progress editor, and deleting an event.
6. **Backup and destructive actions**
   - Create and restore an encrypted backup using fictional data.
   - Test archive/restore and permanent deletion.
   - Confirm recovery messages say what happened and do not claim success after storage failure.
7. **Responsive and keyboard review**
   - Repeat the critical path at 390×844.
   - Use Tab, Shift+Tab, Enter, Space, and Escape without a mouse.
   - Enable reduced motion and 200% zoom.

## Automated checks

After installation:

```bash
npm run check
./node_modules/.bin/playwright install chromium
npm run test:browser
```

The available GitHub integration currently shows the authoritative Actions job failing before useful logs are exposed. Do not interpret that failure as a product-test failure or an infrastructure failure until the first exact job error is visible.

## What to report

For each issue include:

- page and URL;
- viewport and browser;
- exact steps;
- expected result;
- actual result;
- whether data was preserved;
- console error text, if any;
- screenshot with synthetic data only.

Prioritize blockers, lost work, misleading claims, inaccessible controls, unclear next actions, and provenance failures before cosmetic preferences.
