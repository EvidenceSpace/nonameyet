# EvidenceSpace practical quality pass

Use with `quality-standard.md` and the pull-request template. Mark **Observed**, **Blocked**, or **N/A with reason**; never mark expected behavior as verified.

## 1. Truth and scope

- [ ] Current, Partial, Target V1, Future and Decision required are explicit.
- [ ] User outcome, non-goals and primary action are clear.
- [ ] No unsupported legal, security, privacy, accessibility, desktop, performance, AI or marketplace claim.
- [ ] Canonical page/ADR/handoff updated.

## 2. UX states

- [ ] loading, empty, populated, partial, stale, read-only, denied, reconnecting, cancelled, oversized, error and recovery considered;
- [ ] input/drafts survive recoverable failure;
- [ ] duplicate submission and destructive confirmation handled;
- [ ] cross-route origin, exact-object return and active state agree;
- [ ] one dominant purpose per view.

## 3. Accessibility and visual

- [ ] keyboard completion and visible logical focus;
- [ ] semantic names and async announcements;
- [ ] focus trap/restore and Escape;
- [ ] WCAG AA and non-color cues;
- [ ] 200% zoom/reflow or documented canvas alternative;
- [ ] reduced motion;
- [ ] board structured outline equivalence;
- [ ] Windows/macOS, light/dark/System, high DPI, narrow/maximized/restored;
- [ ] no clipping, overlap, dead tab, mismatched bar, hidden primary action or accidental scroll trap.

## 4. Data, authorization and recovery

- [ ] IDs, ownership, revisions and state transitions explicit;
- [ ] server-side allow/deny and negative cross-scope tests;
- [ ] membership, case access, object visibility and operation separated;
- [ ] retry/idempotency/concurrency/stale revision/rollback tested;
- [ ] migration, backup, restore, archive, deletion, cache, search, embeddings and derivatives covered;
- [ ] revocation fails closed everywhere.

## 5. Provenance and AI

- [ ] immutable original and derivative lineage;
- [ ] exact locators reachable;
- [ ] stale/deleted/changed sources fail closed;
- [ ] supporting and contrary material visible;
- [ ] AI output proposed vs accepted is durable;
- [ ] citations verified against retrieved versions;
- [ ] prompt injection cannot alter policy/tool scope;
- [ ] action preview shows sources, destination, visibility, effect and recovery;
- [ ] approval and audit are deterministic; Undo is only promised when safe.

## 6. Notifications, sharing and marketplace

- [ ] notification content is privacy-safe per channel;
- [ ] drawer vs dedicated-route behavior is correct;
- [ ] selected recipient, data, permission, expiry and download preview;
- [ ] payment and membership do not grant case access;
- [ ] booking/payment webhooks and retries are idempotent;
- [ ] lawyer verification, conflict screening and review eligibility covered.

## 7. Performance and reliability

- [ ] representative device/network/board/file/conversation sizes defined;
- [ ] startup, open, input latency, frame pacing, memory and serialization measured;
- [ ] upload/processing cancellation and recovery measured;
- [ ] realtime replay/convergence/revocation measured;
- [ ] AI status, latency, cost and degradation measured;
- [ ] crash/restart recovery observed.

## 8. Security and operations

- [ ] threat model updated;
- [ ] dependencies, licenses, Actions, secrets and generated assets checked;
- [ ] desktop bridge/CSP/navigation/deep-link/updater reviewed;
- [ ] parser and file limits;
- [ ] redaction metadata inspection;
- [ ] backup/deletion/incident drills;
- [ ] logs/analytics/traces/screenshots contain no restricted case content.

## 9. Verification report

Record exact commands, versions, OS, viewports, fixtures, counts, output and remote SHA. List everything not run. Documentation-only changes use `npm run check:docs`, internal-link review, secret scan and remote diff inspection; they do not claim application tests passed.

## Release blockers

Any cross-scope leak, lost/corrupted original, AI approval bypass, invalid verified citation, private-to-shared move, incomplete deletion/redaction, payment duplication, unsigned update, critical accessibility dead end, unexplained data-loss path or unsupported product claim blocks release.
