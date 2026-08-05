import { expect, test } from "playwright/test";

test("preserves an active tab and recovers its run after that tab closes", async ({
  context,
  page,
}) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  const observe = (target: typeof page) => {
    target.on("pageerror", (error) => pageErrors.push(error.message));
    target.on("request", (request) => {
      const url = new URL(request.url());
      if (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname !== "127.0.0.1"
      ) {
        externalRequests.push(request.url());
      }
    });
  };
  observe(page);
  await page.goto("/index.html");

  const caseId = "case-hard-exit";
  const fileId = "file-hard-exit";
  await page.evaluate(
    async ({ caseId, fileId }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase("casefind-preview");
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      const storage = await import(`/storage.js?lease=${Date.now()}`);
      await storage.saveCase({
        id: caseId,
        title: "Hard exit",
        updatedAt: "2026-08-05T18:00:00.000Z",
      });
      await storage.saveProcessing({
        fileId,
        caseId,
        fileHash: "a".repeat(64),
        status: "extracting",
        message: "private partial decoder state",
        updatedAt: "2026-08-05T18:01:00.000Z",
        artifact: { text: "partial text" },
        nextRetryAt: "2026-08-05T18:02:00.000Z",
      });
    },
    { caseId, fileId },
  );

  const owner = await context.newPage();
  observe(owner);
  await owner.goto("/index.html");
  await owner.evaluate(async (fileId) => {
    const lease = await import(`/processing-lease.js?owner=${Date.now()}`);
    const state = globalThis as typeof globalThis & {
      __casefindLeaseHeld?: boolean;
      __casefindLeasePromise?: Promise<unknown>;
    };
    state.__casefindLeaseHeld = false;
    state.__casefindLeasePromise = lease.withProcessingLease(
      fileId,
      async () => {
        state.__casefindLeaseHeld = true;
        await new Promise(() => {});
      },
    );
  }, fileId);
  await expect
    .poll(() =>
      owner.evaluate(
        () =>
          (globalThis as typeof globalThis & { __casefindLeaseHeld?: boolean })
            .__casefindLeaseHeld,
      ),
    )
    .toBe(true);

  const whileActive = await page.evaluate(async (caseId) => {
    const recovery = await import(
      `/processing-orphan-recovery.js?active=${Date.now()}`
    );
    const storage = await import(`/storage.js?active=${Date.now()}`);
    const outcome = await recovery.recoverOrphanedProcessingRuns(caseId);
    const job = (await storage.getProcessingForCase(caseId))[0];
    return { outcome, status: job.status, message: job.message };
  }, caseId);
  expect(whileActive.outcome).toEqual({
    recovered: [],
    active: [fileId],
    unconfirmed: [],
    invalid: 0,
  });
  expect(whileActive.status).toBe("extracting");
  expect(whileActive.message).toBe("private partial decoder state");

  await owner.close();
  await expect
    .poll(
      () =>
        page.evaluate(async (fileId) => {
          const lease = await import(
            `/processing-lease.js?query=${Date.now()}`
          );
          const snapshot = await navigator.locks.query();
          return snapshot.held.some(
            (lock) => lock.name === lease.processingLockName(fileId),
          );
        }, fileId),
      { timeout: 5_000 },
    )
    .toBe(false);

  const afterClose = await page.evaluate(async (caseId) => {
    const recovery = await import(
      `/processing-orphan-recovery.js?closed=${Date.now()}`
    );
    const storage = await import(`/storage.js?closed=${Date.now()}`);
    const outcome = await recovery.recoverOrphanedProcessingRuns(caseId);
    const job = (await storage.getProcessingForCase(caseId))[0];
    return {
      outcome,
      status: job.status,
      code: job.failure?.code,
      retryable: job.failure?.retryable,
      message: job.message,
      hasArtifact: Object.hasOwn(job, "artifact"),
      hasRetryTime: Object.hasOwn(job, "nextRetryAt"),
    };
  }, caseId);

  expect(afterClose.outcome.recovered).toEqual([fileId]);
  expect(afterClose.status).toBe("failed");
  expect(afterClose.code).toBe("transient_error");
  expect(afterClose.retryable).toBe(true);
  expect(afterClose.message).toContain("original remains stored locally");
  expect(afterClose.hasArtifact).toBe(false);
  expect(afterClose.hasRetryTime).toBe(false);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
