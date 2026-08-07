import { expect, test } from "playwright/test";

const sourceBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function openCaseWithSource(page: any, title: string) {
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case for exact-current source-removal checks.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.locator("#file-input").setInputFiles({
    name: "proof.png",
    mimeType: "image/png",
    buffer: sourceBytes,
  });
  await expect(page.locator(".file-row", { hasText: "proof.png" })).toHaveCount(1);
}

test("a fact linked after render blocks duplicate source-removal attempts", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await openCaseWithSource(page, "Late source link");
  const row = page.locator(".file-row", { hasText: "proof.png" });

  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveFact({
      id: storage.createId("fact"),
      caseId,
      type: "other",
      value: "Late-linked fact",
      sourceFileId: file.id,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "whole_file" } },
      status: "confirmed",
      manuallyEntered: true,
      createdAt: new Date().toISOString(),
    });
    (window as any).__sourceRemovalTransactions = 0;
    const originalTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (storeNames, ...rest) {
      const names = typeof storeNames === "string" ? [storeNames] : Array.from(storeNames);
      if (["files", "processing", "facts", "suggestions", "events", "cases"].every((name) => names.includes(name))) {
        (window as any).__sourceRemovalTransactions += 1;
      }
      return originalTransaction.call(this, storeNames, ...rest as any);
    };
  });

  await row.locator(".delete-file").evaluate((button) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(page.locator("#upload-message")).toHaveText(
    "Remove any linked facts, suggestions, or timeline items before deleting this source record.",
  );
  await expect(row).toHaveCount(1);
  await expect(row.locator("button:disabled")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__sourceRemovalTransactions)).toBe(1);

  const state = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      files: (await storage.getFilesForCase(caseId)).length,
      facts: (await storage.getFactsForCase(caseId)).length,
    };
  });
  expect(state).toEqual({ files: 1, facts: 1 });
  expect(pageErrors).toEqual([]);
});

test("a source changed after render is not removed as the stale row", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await openCaseWithSource(page, "Stale source row");
  const row = page.locator(".file-row", { hasText: "proof.png" });

  const changedAt = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    const changedAt = "2026-08-07T02:00:00.000Z";
    const db = await storage.openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put({ ...file, createdAt: changedAt });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("File update aborted"));
      });
    } finally {
      db.close();
    }
    return changedAt;
  });

  await row.locator(".delete-file").click();
  await expect(page.locator("#upload-message")).toHaveText(
    "This source record changed in another tab. Nothing was removed. Reload and review the latest version.",
  );
  await expect(row).toHaveCount(1);
  await expect(row.locator("button:disabled")).toHaveCount(0);

  const current = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    return { count: file ? 1 : 0, createdAt: file?.createdAt };
  });
  expect(current).toEqual({ count: 1, createdAt: changedAt });
  expect(pageErrors).toEqual([]);
});
