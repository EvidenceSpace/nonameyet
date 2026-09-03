import { expect, test } from "playwright/test";

async function completeIntake(page: import("playwright/test").Page, title: string) {
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("12500");
  await page.locator("#summary").fill("The agreed work was delivered and the remaining payment has not been received.");
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 2 of 3");
  const goal = page.locator('input[name="goal"][value="request"]');
  await expect(goal).toBeVisible();
  await goal.check({ force: true });
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  const acknowledgement = page.locator("#local-storage-ack");
  await expect(acknowledgement).toBeVisible();
  await acknowledgement.check({ force: true });
}

async function submitIntake(page: import("playwright/test").Page) {
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
}

test("keeps intake entries through a blocked storage open and retries one draft", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });

  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("casefind-preview");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database deletion blocked"));
    });
  });
  await page.addInitScript(() => {
    const nativeOpen = IDBFactory.prototype.open;
    let blockNextCaseOpen = true;
    let blockedOpenCount = 0;
    Object.defineProperty(IDBFactory.prototype, "open", {
      configurable: true,
      writable: true,
      value(this: IDBFactory, name: string, version?: number) {
        if (!blockNextCaseOpen || name !== "casefind-preview" || version !== 6) return nativeOpen.call(this, name, version);
        blockNextCaseOpen = false;
        blockedOpenCount += 1;
        const request: Record<string, unknown> = {};
        queueMicrotask(() => (request.onblocked as ((event: Event) => void) | undefined)?.(new Event("blocked")));
        return request;
      },
    });
    Object.defineProperty(globalThis, "__casefindBlockedOpenCount", { configurable: true, get: () => blockedOpenCount });
  });

  await page.goto("/cases-new.html");
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindBlockedOpenCount: number }).__casefindBlockedOpenCount)).toBe(0);
  await completeIntake(page, "Blocked draft remains here");
  const submit = page.locator("#continue-button");
  await expect(submit).toBeEnabled();
  await submitIntake(page);
  const recovery = page.locator("#creation-error");
  await expect(recovery).toHaveAttribute("data-state", "blocked");
  await expect(recovery).toContainText("Your entries are still here and no case was changed");
  await expect(page.locator("#case-title")).toHaveValue("Blocked draft remains here");
  await expect(page.locator('input[name="goal"][value="request"]')).toBeChecked();
  await expect(page.locator("#local-storage-ack")).toBeChecked();
  await expect(submit).toContainText("Try saving again");
  await expect(submit).toBeEnabled();
  await expect(page.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindBlockedOpenCount: number }).__casefindBlockedOpenCount)).toBe(1);

  await submitIntake(page);
  await expect(page.locator("#created-state")).toBeVisible();
  const databaseState = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("casefind-preview", 6);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database read blocked"));
    });
    const cases = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction("cases").objectStore("cases").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const version = db.version;
    db.close();
    return { cases, version };
  });
  expect(databaseState.version).toBe(6);
  expect(databaseState.cases).toHaveLength(1);
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindBlockedOpenCount: number }).__casefindBlockedOpenCount)).toBe(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  await page.close({ runBeforeUnload: false });
});
