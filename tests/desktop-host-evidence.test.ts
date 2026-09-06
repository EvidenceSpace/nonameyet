import assert from "node:assert/strict";
import test from "node:test";

import {
  BOARD_FRAME_P95_LIMIT_MS,
  assessDesktopHostEvidence,
  type DesktopHostCandidate,
  type DesktopHostPlatform,
} from "../src/desktop/spike-evidence.js";

function observation(candidate: DesktopHostCandidate, platform: DesktopHostPlatform) {
  return {
    candidate,
    platform,
    architecture: platform === "windows" ? "x64" : "arm64",
    hostVersion: candidate === "electron" ? "candidate-1.0.0" : "candidate-2.0.0",
    osVersion: platform === "windows" ? "windows-11-24h2" : "macos-15.6",
    commitSha: "a".repeat(40),
    artifactSha256: "b".repeat(64),
    measuredAt: "2026-09-06T06:30:00.000Z",
    packagedArtifactBytes: 120_000_000,
    coldStartMs: 1_400,
    warmStartMs: 700,
    idlePrivateMemoryBytes: 260_000_000,
    boardFrameP95Ms: 14,
    recoveredAfterCrash: true,
    deepLinkValidated: true,
    filePickerValidated: true,
    accessibilityTreeInspected: true,
    updaterSignatureValidated: true,
  };
}

function completeMatrix() {
  return [
    observation("electron", "windows"),
    observation("electron", "macos"),
    observation("tauri", "windows"),
    observation("tauri", "macos"),
  ];
}

test("a desktop host decision requires complete Windows and macOS evidence for both candidates", () => {
  const assessment = assessDesktopHostEvidence(completeMatrix());
  assert.equal(assessment.readyForDecision, true);
  assert.deepEqual(assessment.missing, []);
  assert.deepEqual(assessment.blockers, []);
});

test("missing candidate-platform observations block a decision", () => {
  const assessment = assessDesktopHostEvidence([observation("electron", "windows")]);
  assert.equal(assessment.readyForDecision, false);
  assert.deepEqual(assessment.missing, ["electron:macos", "tauri:windows", "tauri:macos"]);
});

test("duplicate and malformed observations fail closed without echoing their data", () => {
  const duplicate = observation("electron", "windows");
  const assessment = assessDesktopHostEvidence([
    duplicate,
    { ...duplicate, artifactSha256: "secret-not-a-hash" },
    duplicate,
  ]);
  assert.equal(assessment.readyForDecision, false);
  assert.ok(assessment.blockers.includes("invalid_observation:1"));
  assert.ok(assessment.blockers.includes("duplicate_observation:electron:windows"));
  assert.equal(JSON.stringify(assessment).includes("secret-not-a-hash"), false);
});

test("frame, crash, deep-link, picker, accessibility, and updater failures remain decision blockers", () => {
  const matrix = completeMatrix();
  matrix[0] = {
    ...matrix[0]!,
    boardFrameP95Ms: BOARD_FRAME_P95_LIMIT_MS + 0.1,
    recoveredAfterCrash: false,
    deepLinkValidated: false,
    filePickerValidated: false,
    accessibilityTreeInspected: false,
    updaterSignatureValidated: false,
  };

  const assessment = assessDesktopHostEvidence(matrix);
  assert.equal(assessment.readyForDecision, false);
  assert.ok(assessment.blockers.includes("frame_budget:electron:windows"));
  assert.ok(assessment.blockers.includes("quality_gate:electron:windows:recoveredAfterCrash"));
  assert.ok(assessment.blockers.includes("quality_gate:electron:windows:deepLinkValidated"));
  assert.ok(assessment.blockers.includes("quality_gate:electron:windows:filePickerValidated"));
  assert.ok(assessment.blockers.includes("quality_gate:electron:windows:accessibilityTreeInspected"));
  assert.ok(assessment.blockers.includes("quality_gate:electron:windows:updaterSignatureValidated"));
});

test("unbounded or non-array evidence sets fail closed", () => {
  assert.equal(assessDesktopHostEvidence(null).readyForDecision, false);
  assert.equal(assessDesktopHostEvidence(new Array(17).fill({})).blockers[0], "invalid_evidence_set");
});
