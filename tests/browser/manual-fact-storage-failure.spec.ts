import { expect, test } from "playwright/test";
import { seedWorkspaceFiles, waitForWorkspace } from "./workspace-file-fixture";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const failureMessage = "The fact could not be saved on this device. Nothing was changed. Try again.";

test("an interrupted manual fact save preserves the draft without partial state", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Atomic manual fact save");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that interrupted manual fact saves preserve the user's draft and provenance.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [{ id: "file_manual_fact_failure", name: "invoice.png", mimeType: "image/png", buffer: imageBytes }]);
  const before = await page.evaluate(async () => {
    const id = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return { updatedAt: (await storage.getCase(id)).updatedAt };
  });
  await page.locator("#add-fact").click();
  await expect(page.locator("#fact-dialog")).toBeVisible();
  await page.locator("#fact-type").selectOption("other");
  await page.locator("#fact-value").fill("Invoice total ₹5,000");
  await page.locator("#fact-note").fill("Entered after checking the original invoice.");
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args as [unknown]);
      if (!injected && this.name === "cases" && this.transaction.objectStoreNames.contains("facts")) {
        injected = true;
        this.transaction.abort();
      }
      return request;
    };
  });
  await page.locator("#fact-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator("#upload-message")).toHaveText(failureMessage);
  await expect(page.locator("#fact-dialog")).toBeVisible();
  await expect(page.locator("#fact-value")).toHaveValue("Invoice total ₹5,000");
  await expect(page.locator("#fact-note")).toHaveValue("Entered after checking the original invoice.");
  await expect(page.locator(".fact-record")).toHaveCount(0);
  const stored = await page.evaluate(async () => {
    const id = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return { facts: await storage.getFactsForCase(id), updatedAt: (await storage.getCase(id)).updatedAt };
  });
  expect(stored.facts).toEqual([]);
  expect(stored.updatedAt).toBe(before.updatedAt);
  await page.locator("#cancel-fact").click();
  await page.reload();
  await waitForWorkspace(page);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
