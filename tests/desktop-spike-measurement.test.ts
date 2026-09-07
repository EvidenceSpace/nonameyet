import assert from "node:assert/strict";
import test from "node:test";

import {
  DESKTOP_SPIKE_FRAME_SAMPLE_COUNT,
  summarizeDesktopSpikeFrameSamples,
  validateDesktopSpikeMeasurementFixture,
} from "../src/desktop/spike-measurement.js";
import { createDesktopSpikeFixture } from "../src/desktop/spike-fixture.js";

test("the measurement boundary accepts the exact deterministic Board and outline", async () => {
  const fixture = await createDesktopSpikeFixture();
  const result = validateDesktopSpikeMeasurementFixture(fixture);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.fixtureVersion, "desktop-spike-fixture.v1");
  assert.equal(result.value.caseId, "C-03");
  assert.equal(result.value.objects.length, 1_000);
  assert.equal(result.value.connections.length, 4_000);
  assert.equal(result.value.outlineEntries.length, 1_000);
  assert.equal(result.value.outlineRelations.length, 4_000);
  assert.equal(Object.isFrozen(result.value.objects), true);
  assert.equal(Object.isFrozen(result.value.connections[0]), true);
  assert.ok(result.value.boardWidth > 0);
  assert.ok(result.value.boardHeight > 0);
});

test("tampered object or outline data fails closed without echoing input", async () => {
  const fixture = await createDesktopSpikeFixture();
  const objects = [...fixture.board.objects];
  objects[4] = { ...objects[4]!, id: "../private-path" };
  const objectResult = validateDesktopSpikeMeasurementFixture({
    ...fixture,
    board: { ...fixture.board, objects },
  });
  assert.deepEqual(objectResult, { ok: false, error: "invalid_fixture" });
  assert.equal(JSON.stringify(objectResult).includes("private-path"), false);

  const relations = [...fixture.outline.relations];
  relations[0] = { ...relations[0]!, toObjectId: "E-04" };
  assert.deepEqual(
    validateDesktopSpikeMeasurementFixture({
      ...fixture,
      outline: { ...fixture.outline, relations },
    }),
    { ok: false, error: "invalid_fixture" },
  );
});

test("fixture and frame validators reject accessors without invoking them", async () => {
  const fixture = await createDesktopSpikeFixture();
  let accessed = false;
  const maliciousFixture = { ...fixture };
  Object.defineProperty(maliciousFixture, "version", {
    enumerable: true,
    get() {
      accessed = true;
      throw new Error("must not run");
    },
  });
  assert.deepEqual(validateDesktopSpikeMeasurementFixture(maliciousFixture), {
    ok: false,
    error: "invalid_fixture",
  });
  assert.equal(accessed, false);

  const samples = new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT).fill(10);
  Object.defineProperty(samples, "0", {
    enumerable: true,
    get() {
      accessed = true;
      throw new Error("must not run");
    },
  });
  assert.deepEqual(summarizeDesktopSpikeFrameSamples(samples), {
    ok: false,
    error: "invalid_frame_samples",
  });
  assert.equal(accessed, false);
});

test("the p95 summary uses nearest rank and returns only bounded aggregate metrics", () => {
  const samples = [...new Array(114).fill(10), ...new Array(6).fill(30)];
  const result = summarizeDesktopSpikeFrameSamples(samples);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value, {
    sampleCount: 120,
    p95Ms: 10,
    minMs: 10,
    maxMs: 30,
    limitMs: 16.7,
    passed: true,
  });
  assert.equal("samples" in result.value, false);
});

test("the frame gate fails above 16.7 ms and invalid samples are never accepted", () => {
  const failing = summarizeDesktopSpikeFrameSamples(
    new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT).fill(16.8),
  );
  assert.equal(failing.ok, true);
  if (failing.ok) assert.equal(failing.value.passed, false);

  for (const invalid of [
    [],
    new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT - 1).fill(10),
    new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT).fill(0),
    new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT).fill(Number.NaN),
    new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT).fill(1_001),
  ]) {
    assert.deepEqual(summarizeDesktopSpikeFrameSamples(invalid), {
      ok: false,
      error: "invalid_frame_samples",
    });
  }

  const extraProperty = new Array(DESKTOP_SPIKE_FRAME_SAMPLE_COUNT).fill(10);
  Object.assign(extraProperty, { sourcePath: "/private/source" });
  const rejected = summarizeDesktopSpikeFrameSamples(extraProperty);
  assert.deepEqual(rejected, {
    ok: false,
    error: "invalid_frame_samples",
  });
  assert.equal(JSON.stringify(rejected).includes("/private/source"), false);
});
