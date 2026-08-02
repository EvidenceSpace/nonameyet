# Malformed extraction workspace boundary

The workspace uses the same extracted-page validator as the analysis client. A malformed derivative cannot appear reviewable merely because its status says `ready_for_ai`.

The Chromium lifecycle stores a matching source hash with duplicate page numbers and requires:

1. The source row is marked failed rather than text-ready.
2. A clear message asks the user to process the source again.
3. The extracted-text viewer and AI-analysis action are hidden.
4. No fact or downstream suggestion is created.
5. The original remains independently previewable with its SHA-256.
6. Retry remains available.
7. The fail-closed state persists across reload.
8. No external request, provider call, account dependency, or synchronization occurs.

Sharing one validator between the workspace and request boundary prevents the UI and network layers from disagreeing about whether an extraction is safe to use.
