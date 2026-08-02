import assert from "node:assert/strict";
import test from "node:test";
import { describeStorageHealth, formatStorageBytes } from "../web/storage-health-model.js";

test("persistent storage is labeled without promising permanence", () => {
  const result = describeStorageHealth({ persisted: true, usage: 50, quota: 100 });
  assert.equal(result.state, "protected");
  assert.match(result.detail, /Manual clearing, device loss, and quota limits/);
  assert.equal(result.ratio, 0.5);
  assert.equal(result.remaining, 50);
});

test("browser-managed storage identifies reported pressure honestly", () => {
  const pressure = describeStorageHealth({ persisted: false, usage: 81, quota: 100 });
  assert.equal(pressure.state, "pressure");
  assert.match(pressure.detail, /Estimated use/);
  assert.equal(pressure.remaining, 19);
  assert.equal(describeStorageHealth({ persisted: false, usage: 20, quota: 100 }).state, "managed");
});

test("missing, malformed, and over-quota estimates fail safely", () => {
  assert.equal(describeStorageHealth({ supported: false }).state, "unavailable");
  assert.equal(describeStorageHealth({ usage: -1, quota: 0 }).remaining, null);
  const over = describeStorageHealth({ usage: 120, quota: 100 });
  assert.equal(over.ratio, 1);
  assert.equal(over.remaining, 0);
  assert.equal(formatStorageBytes(NaN), "0 bytes");
  assert.equal(formatStorageBytes(1024), "1.0 KB");
});
