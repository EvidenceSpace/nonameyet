import { expect, test } from "playwright/test";

test("atomically keeps newer processing state when stale work finishes", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/index.html");
  const result = await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("casefind-preview");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    const storage = await import(`/storage.js?cas=${Date.now()}`);
    const recovery = await import(`/processing-run-recovery.js?cas=${Date.now()}`);
    const caseId = "case-cas";
    const fileId = "file-cas";
    const expected = {
      fileId,
      caseId,
      fileHash: "a".repeat(64),
      status: "ready_for_ai",
      message: "Text ready with one missing page.",
      updatedAt: "2026-08-05T12:00:00.000Z",
      artifact: {
        adapterId: "pdfjs-text",
        adapterVersion: "1.0.0+pdfjs-4.10.38",
        pages: [{ pageNumber: 1, text: "Existing text" }, { pageNumber: 2, text: "" }],
        text: "Existing text",
        warnings: ["Page 2 needs OCR."],
      },
      failure: { code: "ocr_timeout", retryable: true },
    };
    const improved = {
      ...expected,
      message: "Text ready from 2 pages.",
      updatedAt: "2026-08-05T12:01:00.000Z",
      artifact: {
        ...expected.artifact,
        adapterId: "pdfjs-text+local-pdf-ocr",
        pages: [{ pageNumber: 1, text: "Existing text" }, { pageNumber: 2, text: "Recovered text" }],
        text: "Existing text\n\nRecovered text",
        warnings: [],
      },
      failure: undefined,
    };

    await storage.saveCase({ id: caseId, title: "CAS test", updatedAt: "2026-08-05T11:59:00.000Z" });
    await storage.saveProcessing(expected);
    const firstReplacement = await storage.saveProcessingIfCurrent(expected, improved);
    const afterFirst = (await storage.getProcessingForCase(caseId))[0];

    const staleSnapshot = structuredClone(afterFirst);
    const newer = { ...afterFirst, message: "Newer processing result", updatedAt: "2026-08-05T12:02:00.000Z" };
    await storage.saveProcessing(newer);
    const activityBeforeConflict = (await storage.getCase(caseId)).updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const staleReplacement = { ...afterFirst, message: "Stale retry result", updatedAt: "2026-08-05T12:03:00.000Z" };
    const secondReplacement = await storage.saveProcessingIfCurrent(staleSnapshot, staleReplacement);
    const afterConflict = (await storage.getProcessingForCase(caseId))[0];
    const activityAfterConflict = (await storage.getCase(caseId)).updatedAt;

    const firstRunMarker = {
      fileId,
      caseId,
      fileHash: expected.fileHash,
      status: "extracting",
      message: "Older processing run",
      updatedAt: "2026-08-05T12:04:00.000Z",
    };
    await storage.saveProcessing(firstRunMarker);
    const newerRunMarker = {
      ...firstRunMarker,
      message: "Newer processing run",
      updatedAt: "2026-08-05T12:05:00.000Z",
    };
    await storage.saveProcessing(newerRunMarker);
    const ordinaryActivityBeforeConflict = (await storage.getCase(caseId)).updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 10));
    const staleRunResult = {
      ...improved,
      message: "Older run result",
      updatedAt: "2026-08-05T12:06:00.000Z",
    };
    const ordinaryReplacement = await storage.saveProcessingIfCurrent(firstRunMarker, staleRunResult);
    const afterOrdinaryConflict = (await storage.getProcessingForCase(caseId))[0];
    const ordinaryActivityAfterConflict = (await storage.getCase(caseId)).updatedAt;

    const failedRunMarker = {
      ...firstRunMarker,
      message: "Run that exits unexpectedly",
      updatedAt: "2026-08-05T12:07:00.000Z",
    };
    await storage.saveProcessing(failedRunMarker);
    const failureJob = recovery.buildUnexpectedProcessingFailure(
      failedRunMarker,
      "2026-08-05T12:08:00.000Z",
    );
    const failureRecovered = await storage.saveProcessingIfCurrent(failedRunMarker, failureJob);
    const afterFailureRecovery = (await storage.getProcessingForCase(caseId))[0];

    return {
      firstReplacement,
      firstMessage: afterFirst.message,
      secondReplacement,
      finalMessage: afterConflict.message,
      activityBeforeConflict,
      activityAfterConflict,
      ordinaryReplacement,
      ordinaryFinalMessage: afterOrdinaryConflict.message,
      ordinaryActivityBeforeConflict,
      ordinaryActivityAfterConflict,
      failureRecovered,
      failureStatus: afterFailureRecovery.status,
      failureCode: afterFailureRecovery.failure?.code,
      failureRetryable: afterFailureRecovery.failure?.retryable,
      failureMessage: afterFailureRecovery.message,
      failureHasArtifact: Object.hasOwn(afterFailureRecovery, "artifact"),
    };
  });

  expect(result.firstReplacement).toBe(true);
  expect(result.firstMessage).toBe("Text ready from 2 pages.");
  expect(result.secondReplacement).toBe(false);
  expect(result.finalMessage).toBe("Newer processing result");
  expect(result.activityAfterConflict).toBe(result.activityBeforeConflict);
  expect(result.ordinaryReplacement).toBe(false);
  expect(result.ordinaryFinalMessage).toBe("Newer processing run");
  expect(result.ordinaryActivityAfterConflict).toBe(result.ordinaryActivityBeforeConflict);
  expect(result.failureRecovered).toBe(true);
  expect(result.failureStatus).toBe("failed");
  expect(result.failureCode).toBe("transient_error");
  expect(result.failureRetryable).toBe(true);
  expect(result.failureMessage).toContain("original remains stored locally");
  expect(result.failureHasArtifact).toBe(false);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
