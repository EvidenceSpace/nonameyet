import assert from "node:assert/strict";
import test from "node:test";

import {
  WINDOWS_LOW_SPEC_REFERENCE_PROFILE,
  assessDesktopHardwareProfile,
} from "../src/desktop/spike-hardware.js";

test("the Windows reference profile records only sanitized performance-relevant fields", () => {
  assert.deepEqual(WINDOWS_LOW_SPEC_REFERENCE_PROFILE, {
    profileVersion: 1,
    profileId: "windows-low-spec-reference-v1",
    platform: "windows",
    osFamily: "windows-11",
    osBuild: "26200.9168",
    architecture: "x64",
    cpuModel: "Intel Core i5-8365U",
    installedMemoryBytes: 8 * 1024 * 1024 * 1024,
    gpuModel: "Intel UHD Graphics 620",
    storageKind: "ssd",
    touchInput: false,
  });

  const serialized = JSON.stringify(WINDOWS_LOW_SPEC_REFERENCE_PROFILE);
  for (const forbidden of [
    "deviceName",
    "deviceId",
    "productId",
    "serialNumber",
    "DESKTOP-",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("the completed reference profile is ready for threshold calibration", () => {
  const assessment = assessDesktopHardwareProfile(
    WINDOWS_LOW_SPEC_REFERENCE_PROFILE,
  );
  assert.equal(assessment.accepted, true);
  assert.equal(assessment.readyForThresholdCalibration, true);
  assert.deepEqual(assessment.missing, []);
  assert.deepEqual(assessment.blockers, []);
});

test("missing build and storage observations remain explicit", () => {
  const assessment = assessDesktopHardwareProfile({
    ...WINDOWS_LOW_SPEC_REFERENCE_PROFILE,
    osBuild: null,
    storageKind: "unknown",
  });
  assert.equal(assessment.accepted, true);
  assert.equal(assessment.readyForThresholdCalibration, false);
  assert.deepEqual(assessment.missing, ["os_build", "storage_kind"]);
});

test("unknown or identifying fields fail closed without echoing their values", () => {
  const assessment = assessDesktopHardwareProfile({
    ...WINDOWS_LOW_SPEC_REFERENCE_PROFILE,
    deviceId: "machine-local-value",
  });
  assert.equal(assessment.accepted, false);
  assert.equal(assessment.profile, null);
  assert.equal(
    JSON.stringify(assessment).includes("machine-local-value"),
    false,
  );
});
