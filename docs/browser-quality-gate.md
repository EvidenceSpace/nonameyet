# Browser lifecycle quality gate

The continuous quality workflow runs a pinned Chromium browser lifecycle after typechecking, unit tests, and PDF.js asset verification.

The lifecycle creates a real local case through the three-step intake, acknowledges the local-storage boundary, opens the workspace, changes a checklist state, reloads the page, and verifies IndexedDB persistence. It then downloads the self-contained verified report and checks that all checklist states and report boundaries are present.

The test also fails on uncaught page errors or any HTTP request to a host other than the local preview server. This guards the local-first workspace against accidental third-party requests during the covered flow. A separate narrow-viewport check catches horizontal overflow on the intake page.

The browser gate deliberately uses one worker and no production case content. Its generated case is synthetic and exists only in the isolated CI browser profile. Traces and screenshots are retained locally by Playwright only when a run fails; they are not uploaded by the workflow.

This is a baseline rather than complete browser coverage. File processing, real PDF fixtures, backup and restore, consistency decisions, deletion, accessibility, Safari, and physical-device coverage remain separate release gates.
