import assert from "node:assert/strict";
import test from "node:test";
import {
  processingLeaseSupported,
  processingLockName,
  withProcessingLease,
} from "../web/processing-lease.js";

test("uses one non-waiting exclusive lock per source file", async () => {
  let observed;
  const lockManager = {
    async request(name, options, callback) {
      observed = { name, options };
      return callback({ name, mode: "exclusive" });
    },
  };
  const outcome = await withProcessingLease("file-1", async () => "completed", {
    lockManager,
  });
  assert.deepEqual(observed, {
    name: "casefind:processing:file-1",
    options: { mode: "exclusive", ifAvailable: true },
  });
  assert.deepEqual(outcome, { acquired: true, value: "completed" });
});

test("does not run when another context owns the processing lock", async () => {
  let ran = false;
  const outcome = await withProcessingLease(
    "file-2",
    async () => {
      ran = true;
    },
    {
      lockManager: {
        request: async (_name, _options, callback) => callback(null),
      },
    },
  );
  assert.equal(ran, false);
  assert.deepEqual(outcome, { acquired: false, reason: "busy" });
});

test("fails closed when Web Locks are unsupported or unavailable", async () => {
  let ran = false;
  const task = async () => {
    ran = true;
  };
  assert.deepEqual(
    await withProcessingLease("file-3", task, { lockManager: null }),
    {
      acquired: false,
      reason: "unsupported",
    },
  );
  assert.deepEqual(
    await withProcessingLease("file-3", task, {
      lockManager: {
        request: async () => {
          throw new Error("lock service failed");
        },
      },
    }),
    { acquired: false, reason: "unavailable" },
  );
  assert.equal(ran, false);
  assert.equal(processingLeaseSupported(null), false);
});

test("propagates task failures after ownership is granted", async () => {
  await assert.rejects(
    () =>
      withProcessingLease(
        "file-4",
        async () => {
          throw new Error("owned task failed");
        },
        {
          lockManager: {
            request: async (_name, _options, callback) => callback({}),
          },
        },
      ),
    /owned task failed/,
  );
});

test("rejects invalid source identity and tasks before requesting a lock", async () => {
  let requested = false;
  const lockManager = {
    request: async () => {
      requested = true;
    },
  };
  await assert.rejects(
    () => withProcessingLease("", async () => {}, { lockManager }),
    /file identity is invalid/,
  );
  await assert.rejects(
    () => withProcessingLease("file-5", null, { lockManager }),
    /task is invalid/,
  );
  assert.equal(requested, false);
  assert.equal(processingLockName("file-5"), "casefind:processing:file-5");
});
