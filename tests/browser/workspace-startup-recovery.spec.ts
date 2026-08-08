import { expect, test } from "playwright/test";

async function closeBlockerAndWaitForUpgrade(page: import("playwright/test").Page) {
  await page.evaluate(async () => {
    (globalThis as typeof globalThis & { __casefindWorkspaceBlocker: IDBDatabase }).__casefindWorkspaceBlocker.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("casefind-preview", 6);
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database upgrade remained blocked"));
    });
  });
}

test("separates a missing local case from a storage failure", async ({ page }) => {
  await page.goto("/case.html?id=missing-local-case");
  const error = page.locator("#workspace-error");
  await expect(error).toHaveAttribute("data-state", "missing");
  await expect(error).toContainText("We couldn’t find this local case");
  await expect(error).toContainText("CaseFind did not create or change any records");
  await expect(error.locator(".storage-recovery-retry")).toHaveCount(0);
  await expect(page.locator("#delete-case")).toBeHidden();
  await expect(page.locator(".skip-link")).toHaveAttribute("href", "#workspace-error");
  await expect(error.getByRole("link", { name: "Back to local cases" })).toHaveAttribute("href", "cases.html");
});

test("blocks workspace feature modules until local storage opens safely", async ({ context, page }) => {
  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase("casefind-preview"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error("Database deletion blocked")); });
    const blocker = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("casefind-preview", 5); request.onupgradeneeded = () => request.result.createObjectStore("cases", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error("Database creation blocked")); });
    Object.defineProperty(globalThis, "__casefindWorkspaceBlocker", { configurable: true, value: blocker });
  });
  const workspacePage = await context.newPage();
  const pageErrors: string[] = []; const externalRequests: string[] = [];
  workspacePage.on("pageerror", (error) => pageErrors.push(error.message));
  workspacePage.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await workspacePage.goto("/case.html?id=blocked-case");
  const recovery = workspacePage.locator(".storage-recovery");
  await expect(recovery).toHaveAttribute("data-state", "blocked");
  await expect(recovery).toContainText("Your local case data was not changed");
  await expect(recovery.locator(".storage-recovery-retry")).toHaveText("Retry opening case");
  await expect(workspacePage.locator("#delete-case")).toBeHidden();
  await expect(workspacePage.locator(".case-details-trigger")).toHaveCount(0);
  await expect(workspacePage.locator(".timeline-section")).toHaveCount(0);
  await closeBlockerAndWaitForUpgrade(page);
  await recovery.locator(".storage-recovery-retry").click();
  await expect(workspacePage.locator("#workspace-error")).toHaveAttribute("data-state", "missing");
  await expect(workspacePage.locator(".storage-recovery")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("keeps the workspace inert when IndexedDB is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: { open() { const request: Record<string, unknown> = {}; queueMicrotask(() => (request.onerror as (() => void) | undefined)?.()); return request; } },
    });
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/case.html?id=unavailable-case");
  const recovery = page.locator(".storage-recovery");
  await expect(recovery).toHaveAttribute("data-state", "unavailable");
  await expect(recovery).toContainText("This case could not be opened safely");
  await expect(recovery).toContainText("Nothing was changed or deleted");
  await expect(recovery).toContainText("Do not clear site data");
  await expect(page.locator("#delete-case")).toBeHidden();
  await expect(page.locator(".case-details-trigger")).toHaveCount(0);
  await expect(page.locator(".timeline-section")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
