# Reliable local case creation

Case creation and later case-detail editing use the same `validateCaseDetails` boundary. This prevents intake and editing rules from drifting apart.

Limits are enforced in both HTML and JavaScript:

- title: 3–120 characters;
- client: 2–120 characters;
- amount: optional, at most 60 characters;
- summary: 30–4,000 characters;
- goal: one of the four supported values.

The final submit validates again, disables duplicate submission, and shows a truthful “Saving on this device…” state. The success screen appears only after the IndexedDB write resolves. If local persistence fails, the intake form and every entry remain visible, and the user receives a browser-storage error with a retry path. A failure never produces a fake case-created state or workspace link.
