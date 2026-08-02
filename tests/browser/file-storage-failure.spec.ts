import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const failureMessage = "proof.png could not be stored on this device. Check available browser storage and try again.";

test("a quota-like activity update failure leaves no partial file state", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Atomic file storage failure");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that aborted local writes never leave partial file state.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  const initialUpdatedAt = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return (await storage.getCase(caseId)).updatedAt;
  });
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (...args) {
      const request = originalPut.apply(this, args as [unknown]);
      if (!injected && this.name === "cases" && this.transaction.objectStoreNames.contains("files")) {
        injected = true;
        this.transaction.abort();
      }
      return request;
    };
  });

  await page.locator("#file-input").setInputFiles({
    name: "proof.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  await expect(page.locator("#upload-message")).toHaveClass(/error/);
  await expect(page.locator("#upload-message")).toHaveText(failureMessage);
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator(".empty-files")).toContainText("No records added yet");
  await expect(page.locator("#file-count")).toHaveText("0");
  await expect(page.locator("#nav-file-count")).toHaveText("0");
  await expect(page.locator("#file-size")).toHaveText("0 bytes");

  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return { files: await storage.getFilesForCase(caseId), record: await storage.getCase(caseId) };
  });
  expect(stored.files).toEqual([]);
  expect(stored.record.updatedAt).toBe(initialUpdatedAt);

  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("0");
  await expect(page.locator("#file-size")).toHaveText("0 bytes");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
