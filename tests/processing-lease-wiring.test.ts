import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lease = readFileSync(
  new URL("../web/processing-lease.js", import.meta.url),
  "utf8",
);
const recovery = readFileSync(
  new URL("../web/processing-orphan-recovery.js", import.meta.url),
  "utf8",
);
const bootstrap = readFileSync(
  new URL("../web/workspace-bootstrap.js", import.meta.url),
  "utf8",
);
const ui = readFileSync(
  new URL("../web/processing-ui.js", import.meta.url),
  "utf8",
);

test("uses a non-waiting exclusive Web Lock instead of an expiring timer lease", () => {
  assert.match(
    lease,
    /lockManager\.request\(\s*name,\s*\{ mode: "exclusive", ifAvailable: true \}/,
  );
  assert.doesNotMatch(lease, /setInterval|setTimeout|expiresAt|steal:/);
});

test("recovers only extracting snapshots while holding the same source lock", () => {
  assert.match(recovery, /if \(job\?\.status !== "extracting"\) continue/);
  assert.match(recovery, /withProcessingLeaseImpl\(job\.fileId, async \(\) =>/);
  assert.match(recovery, /saveProcessingIfCurrentImpl\(job, failure\)/);
  assert.doesNotMatch(recovery, /saveProcessing\(/);
});

test("finishes orphan recovery before loading workspace feature modules", () => {
  const recoveryIndex = bootstrap.indexOf(
    "await recoverOrphanedProcessingRuns(caseId)",
  );
  const modulesIndex = bootstrap.indexOf("await loadWorkspaceModules()");
  assert.notEqual(recoveryIndex, -1);
  assert.ok(modulesIndex > recoveryIndex);
});

test("ordinary and preserved processing both run inside the source lease", () => {
  const leaseIndex = ui.indexOf(
    "withProcessingLease(file.id, () => runOwned(file, options))",
  );
  const ownedRunIndex = ui.indexOf("async function runOwned");
  const markerWriteIndex = ui.indexOf("await saveProcessing(runMarker)");
  assert.notEqual(leaseIndex, -1);
  assert.ok(ownedRunIndex > leaseIndex);
  assert.ok(markerWriteIndex > ownedRunIndex);
  assert.match(ui, /runId: crypto\.randomUUID\(\)/);
  assert.match(ui, /leaseRequests\.has\(file\.id\)/);
  assert.match(ui, /PROCESSING_BUSY_MESSAGE/);
  assert.match(ui, /PROCESSING_LEASE_UNAVAILABLE_MESSAGE/);
});

test("visible tabs safely recheck orphan ownership and refresh cross-tab results", () => {
  assert.match(ui, /recoverOrphanedProcessingRuns\(caseId\)/);
  assert.match(ui, /document\.addEventListener\("visibilitychange"/);
  assert.match(ui, /window\.addEventListener\("focus"/);
  assert.match(ui, /PROCESSING_ACTIVE_ELSEWHERE_MESSAGE/);
  assert.match(ui, /PROCESSING_OWNERSHIP_UNCONFIRMED_MESSAGE/);
});
