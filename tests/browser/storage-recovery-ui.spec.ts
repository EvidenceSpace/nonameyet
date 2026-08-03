import { expect, test } from "playwright/test";

test("explains a blocked storage upgrade and retries without clearing cases", async ({ context, page }) => {
  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase("casefind-preview"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
    const blocker = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("casefind-preview", 5); request.onupgradeneeded = () => request.result.createObjectStore("cases", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    Object.defineProperty(globalThis, "__casefindBlocker", { configurable: true, value: blocker });
  });
  const library = await context.newPage();
  const pageErrors: string[] = []; const externalRequests: string[] = [];
  library.on("pageerror", (error) => pageErrors.push(error.message));
  library.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await library.goto("/cases.html");
  const recovery = library.locator(".storage-recovery");
  await expect(recovery).toHaveAttribute("data-state", "blocked");
  await expect(recovery).toContainText("Close other CaseFind tabs");
  await expect(recovery).toContainText("Your local cases were not changed");
  await expect(recovery).toContainText("Do not clear browser site data");
  await page.evaluate(() => (globalThis as typeof globalThis & { __casefindBlocker: IDBDatabase }).__casefindBlocker.close());
  await recovery.locator(".storage-recovery-retry").click();
  await expect(library.locator("#library-empty")).toBeVisible();
  await expect(library.locator(".storage-recovery")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("explains unavailable browser storage without destructive advice", async ({ page }) => {
  await page.addInitScript(() => {
    const unavailable = { open() { const request: Record<string, unknown> = { error: new DOMException("Storage disabled", "InvalidStateError") }; queueMicrotask(() => (request.onerror as (() => void) | undefined)?.()); return request; } };
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: unavailable });
  });
  await page.goto("/cases.html");
  const recovery = page.locator(".storage-recovery");
  await expect(recovery).toHaveAttribute("data-state", "unavailable");
  await expect(recovery).toContainText("Nothing was changed or deleted");
  await expect(recovery).toContainText("Do not clear site data");
  await expect(recovery.locator(".storage-recovery-retry")).toHaveText("Retry opening cases");
});
