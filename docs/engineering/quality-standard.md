# EvidenceSpace quality standard

## Purpose

Quality is a continuous product property, not a final cosmetic pass. A change is accepted only when the user outcome, trust boundary, failure recovery, accessibility, performance, AI behavior, operations, documentation, and remote delivery state agree.

This document defines the target quality pass. The current prototype’s enforced workflow remains in `docs/continuous-quality.md` and `.github/workflows/quality.yml`.

## Evidence rule

A check counts only when it ran in the reported environment and its output was inspected. Use **Not run**, **Blocked**, or **Not applicable with reason** rather than a false checkmark.

## Current prototype gates

```bash
npm run check:dependencies
npm run check:workflow-actions
npm run sync:pdfjs
npm run typecheck
npm test
npm run test:browser
npm run check
```

Current limitations that must remain visible:

- TypeScript covers `src/**/*.ts` only.
- Browser automation currently targets Chromium, not packaged Windows/macOS clients.
- Existing checks prove the CaseFind prototype behavior, not the EvidenceSpace target.
- Documentation-only changes do not prove application behavior.

## Target continuous integration gates

Introduce these as real repository commands before relying on them:

1. formatting and repository hygiene;
2. lint and full-workspace strict typecheck;
3. dependency, license, lockfile, workflow-action, container, and secret policy;
4. domain/unit tests;
5. API, database, queue, object-storage, realtime, payment, and provider contract tests;
6. schema migration and rollback/forward-compatibility tests;
7. desktop renderer and native-bridge tests;
8. browser/desktop end-to-end journeys;
9. accessibility automation;
10. visual regression for stable critical states;
11. AI evaluation and prompt/tool policy regression;
12. generated asset/build/package drift checks; and
13. signed package/update verification for release branches.

Use fast presubmit gates and scheduled/merge-queue extended gates without allowing the fast tier to hide required failures.

## Quality pass

### 1. Product and specification pass

- User and outcome are explicit.
- Scope and non-goals are explicit.
- Current, Target V1, Future, and Decision required are not mixed.
- Page/section, states, and acceptance criteria are updated.
- Legal/product claims match supported evidence.
- Analytics and success metrics have a privacy-safe measurement plan.

### 2. Domain and data pass

- Ownership and identifiers are unambiguous.
- State transitions are allowlisted.
- Accepted versus suggested/private/shared states are durable, not visual-only.
- Multi-object writes are atomic where required.
- Retry/idempotency, duplicate, stale revision, concurrency, and rollback behavior are specified and tested.
- Migration, downgrade/forward compatibility, backup, restore, retention, archive, deletion, cache, indexes, embeddings, and derivatives are covered.

### 3. Authorization and privacy pass

- Server-side allow/deny matrix tests.
- Cross-workspace/case/object negative tests.
- Revocation reaches API, realtime, cache, downloads, AI, exports, and lawyer sharing.
- Logs, analytics, errors, notifications, traces, crash reports, and artifacts contain no restricted content.
- Consent and recipient/data preview exist for external sharing.
- Support/operations access is least-privileged and audited.

### 4. Provenance and evidence pass

- Original hash/version is preserved.
- Derivatives identify generator/version and parent.
- Every accepted derived claim reaches exact locators.
- Stale/deleted/changed sources fail closed.
- Conflicts and contrary material remain visible.
- Reports, board objects, AI answers, and message conversions preserve links.

### 5. AI quality and action-safety pass

Evaluation corpus uses synthetic or approved data and includes:

- relevant and irrelevant evidence;
- contradictory dates, amounts, identities, and authorities;
- missing jurisdiction and mixed case types;
- hostile prompt-injection content in every retrievable source type;
- long/large contexts and retrieval noise;
- unsupported legal questions and stale sources;
- private/shared and cross-case boundary attempts;
- malformed provider output and invalid citations;
- unauthorized, stale-revision, destructive, external, and payment actions; and
- provider timeout, retry, partial result, and fallback.

Measure and approve thresholds for:

- claim/source precision and citation validity;
- unsupported-claim and wrong-jurisdiction rate;
- contrary-material recall;
- prompt-injection/tool-exfiltration resistance;
- action authorization, preview, idempotency, execution, and undo correctness;
- private/shared leakage;
- user correction/rejection behavior;
- latency and cost by workload; and
- refusal/escalation quality.

Do not replace a failing grounding test with more confident wording.

### 6. UX and content pass

- One clear primary action.
- Loading, empty, populated, partial, read-only, denied, reconnecting, stale, cancelled, oversized, failure, and recovery states.
- Draft preservation and duplicate-action prevention.
- Source, visibility, AI status, and consequences are understandable without hidden documentation.
- Copy is plain, respectful, jurisdiction-aware, and does not imply unsupported certainty.
- Premium prompts are relevant and non-manipulative.

### 7. Accessibility pass

At minimum:

- semantic structure and accessible names;
- keyboard completion of the user journey;
- visible focus and logical order;
- modal focus trap/restore and Escape behavior;
- screen-reader announcements for async status and errors;
- WCAG AA contrast and non-color state cues;
- 200% zoom/reflow or documented desktop-canvas alternative;
- 44px practical targets;
- reduced motion;
- board structured outline equivalence; and
- exported report accessibility checks.

Automation assists but does not replace keyboard and assistive-technology inspection.

### 8. Visual quality pass

Inspect, do not merely render:

- supported Windows and macOS appearance;
- normal, narrow, maximized, restored, and high-DPI windows;
- light/dark theme if supported;
- small, medium, and large board/data states;
- all overlays, drawers, menus, dialogs, toasts, errors, and empty states;
- no overlap, clipping, overflow, unreadable truncation, accidental scroll traps, or hidden primary action;
- consistent spacing, hierarchy, alignment, typography, iconography, and semantic colors;
- tasteful imagery free of fake text/logos; and
- motion and reduced-motion equivalent.

Record which states and environments were actually inspected. Screenshots/traces containing case content are not committed.

### 9. Performance and reliability pass

Define representative device, network, board, file, conversation, and case sizes before measuring.

Measure:

- cold/warm startup and case-open time;
- board input latency, frame pacing, memory, and serialization;
- upload/extraction/transcription throughput and cancellation;
- realtime propagation, reconnect, event replay, and convergence;
- search latency and indexing freshness;
- AI status feedback, completion latency, cost, and provider degradation;
- report generation;
- crash/restart recovery; and
- database/job/object-storage failure recovery.

Optimize from measurements. Do not trade integrity or accessibility for an unproven speedup.

### 10. Security pass

- threat model updated;
- static/dependency/secret scans;
- desktop bridge, CSP, navigation, deep-link, and updater review;
- malicious file/parser limits;
- authorization and penetration tests;
- prompt-injection/action-tool red-team;
- redaction and metadata inspection;
- payment/webhook replay and booking concurrency;
- backup/restore and deletion drill; and
- incident/support-access review.

Production launch requires an independent penetration test for deployed scope.

### 11. Cross-platform desktop pass

For both Windows and macOS:

- install, first launch, sign in, update, restart, uninstall behavior;
- filesystem picker and drag/drop;
- keyboard conventions and shortcuts;
- high DPI/scaling, multiple displays, and window restore;
- sleep/wake and network reconnect;
- deep links and notifications;
- crash recovery and local cache;
- accessibility APIs; and
- signed package/update verification.

A browser test does not prove desktop support.

### 12. Marketplace and operations pass

Where relevant:

- license verification/revalidation and moderation;
- search ranking and sponsored disclosure;
- conflict screening confidentiality;
- selective sharing and access expiry;
- slot reservation concurrency;
- payment/refund/reconciliation/webhooks;
- verified-review eligibility;
- support, dispute, fraud, privacy, and incident runbooks; and
- jurisdiction-specific legal review.

### 13. Documentation and delivery pass

- Canonical docs and ADRs updated.
- README/current status remains honest.
- Migration and rollback are explicit.
- PR contains exact commands/results and unverified areas.
- Committed files and remote commit inspected.
- Required CI and release checks observed.
- No secrets, private fixtures, generated debris, or machine paths.

## Critical end-to-end journeys

Maintain automated and manual coverage for:

1. install/sign in/onboard;
2. create case with AI available and unavailable;
3. upload/process/review evidence;
4. build and recover a board;
5. ask a cited AI question and reject/correct an answer;
6. preview/approve/undo an AI workspace action;
7. invite/collaborate/revoke/reconnect;
8. create/review/export a report;
9. search/book/pay/cancel/refund/review a lawyer consultation; and
10. export/delete account, workspace, and case data according to policy.

## Release blockers

Do not release when any of these is unresolved:

- cross-case or cross-workspace access;
- lost/corrupted original or accepted case data;
- AI action bypassing approval/authorization;
- invalid citations presented as verified;
- private content moved to shared scope;
- incomplete deletion or reversible redaction;
- payment double charge/booking or unverified webhook processing;
- unsigned/untrusted desktop update;
- critical accessibility dead end;
- unexplained crash/data-loss path; or
- product/legal/security claim unsupported by observed behavior.

## Documentation-only pull requests

Required:

- inspect current code and relevant open work;
- verify internal links/paths and terminology consistency;
- check that current and target behavior are separated;
- inspect the committed diff remotely;
- explain that app tests/builds were not run when they were unnecessary.

Documentation-only work does not need fabricated application verification.