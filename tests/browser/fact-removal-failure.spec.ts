import { expect, test, type Page } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const failureMessage = "The fact could not be removed from this device. Nothing was changed. Try again.";
const staleMessage = "This fact changed in another tab. Nothing was removed. Reload and review the latest version.";

function observePage(page: Page) {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });
  return { pageErrors, externalRequests };
}

async function openWorkspace(page: Page, title: string) {
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying exact-current atomic fact removal.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(async (values: number[]) => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const original = new File([Uint8Array.from(values)], "invoice.png", {
      type: "image/png",
      lastModified: 0,
    });
    await storage.saveFile({
      id: "file_atomic_fact_removal",
      caseId,
      name: original.name,
      type: original.type,
      size: original.size,
      sha256: await storage.sha256(original),
      createdAt: "2026-08-06T18:00:00.000Z",
      original,
    });
  }, [...imageBytes]);
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  const fileRow = page.locator(".file-row", { hasText: "invoice.png" });
  await expect(fileRow).toHaveCount(1, { timeout: 30_000 });
  await expect(fileRow.locator(".delete-file")).toBeEnabled();
}

async function seedLegacyFact(page: Page, value: string) {
  return page.evaluate(async (factValue) => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveFact({
      id: "fact_atomic_removal",
      caseId,
      type: "other",
      value: factValue,
      sourceFileId: file.id,
      sourceReference: {
        fileId: file.id,
        sha256: file.sha256,
        locator: { kind: "whole_file" },
      },
      status: "confirmed",
      manuallyEntered: true,
    });
    return {
      updatedAt: (await storage.getCase(caseId)).updatedAt,
      hash: file.sha256,
    };
  }, value);
}

test("an interrupted fact removal preserves the confirmed fact and provenance", async ({ page }) => {
  const observed = observePage(page);
  await openWorkspace(page, "Atomic fact removal");
  const before = await seedLegacyFact(page, "Invoice total ₹5,000");
  await page.reload();

  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  const row = page.locator(".fact-record", { hasText: "Invoice total ₹5,000" });
  await expect(row).toHaveCount(1, { timeout: 30_000 });
  await expect(row.locator(".delete-fact")).toBeEnabled();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (...args) {
      if (!injected && this.name === "cases" && this.transaction.objectStoreNames.contains("facts")) {
        injected = true;
        throw new DOMException("Injected fact-removal case write failure.", "QuotaExceededError");
      }
      return put.apply(this, args as [unknown]);
    };
  });
  await row.locator(".delete-fact").click();

  await expect(page.locator("#fact-decision-status")).toHaveText(failureMessage);
  await expect(row).toHaveCount(1);
  await expect(row).not.toHaveAttribute("aria-busy", "true");
  await expect(row.locator(".delete-fact")).toBeEnabled();
  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      facts: await storage.getFactsForCase(caseId),
      updatedAt: (await storage.getCase(caseId)).updatedAt,
    };
  });
  expect(stored.facts.map((fact: { id: string; sourceReference: { sha256: string } }) => [
    fact.id,
    fact.sourceReference.sha256,
  ])).toEqual([["fact_atomic_removal", before.hash]]);
  expect(stored.updatedAt).toBe(before.updatedAt);
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".fact-record", { hasText: "Invoice total ₹5,000" })).toHaveCount(1);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

test("a stale rendered fact cannot remove the newer stored fact", async ({ page }) => {
  const observed = observePage(page);
  await openWorkspace(page, "Stale fact removal");
  await seedLegacyFact(page, "Invoice total ₹5,000");
  await page.reload();

  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  const staleRow = page.locator(".fact-record", { hasText: "Invoice total ₹5,000" });
  await expect(staleRow).toHaveCount(1, { timeout: 30_000 });
  await expect(staleRow.locator(".delete-fact")).toBeEnabled();
  const beforeRemoval = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [current] = await storage.getFactsForCase(caseId);
    await storage.saveFact({ ...current, value: "Invoice total ₹6,000", updatedAt: "2026-08-06T18:30:00.000Z" });
    return { updatedAt: (await storage.getCase(caseId)).updatedAt };
  });
  await staleRow.locator(".delete-fact").click();

  await expect(page.locator("#fact-decision-status")).toHaveText(staleMessage);
  await expect(staleRow).toHaveCount(1);
  await expect(staleRow).not.toHaveAttribute("aria-busy", "true");
  await expect(staleRow.locator(".delete-fact")).toBeEnabled();
  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      facts: await storage.getFactsForCase(caseId),
      updatedAt: (await storage.getCase(caseId)).updatedAt,
    };
  });
  expect(stored.facts).toHaveLength(1);
  expect(stored.facts[0].value).toBe("Invoice total ₹6,000");
  expect(stored.updatedAt).toBe(beforeRemoval.updatedAt);
  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".fact-record", { hasText: "Invoice total ₹6,000" })).toHaveCount(1);
  expect(observed.externalRequests).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});
