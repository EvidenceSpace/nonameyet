import { expect, test } from "playwright/test";

test.describe.configure({ retries: 0 });
test.setTimeout(20_000);

async function completeIntake(page: import("playwright/test").Page, title: string) {
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("12500");
  await page.locator("#summary").fill("The agreed work was delivered and the remaining payment has not been received.");
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 2 of 3");
  await page.locator('input[name="goal"][value="request"]').check();
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  await page.locator("#local-storage-ack").check();
}

async function submitIntake(page: import("playwright/test").Page) {
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
}

async function closeDiagnosticPage(page: import("playwright/test").Page) {
  if (page.isClosed()) return;
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.reset()).catch(() => undefined);
  await page.close({ runBeforeUnload: false }).catch(() => undefined);
}

async function installUnavailableOpen(page: import("playwright/test").Page) {
  await page.addInitScript(() => {
    const nativeOpen = IDBFactory.prototype.open;
    let unavailableOpenCount = 0;
    Object.defineProperty(IDBFactory.prototype, "open", {
      configurable: true,
      writable: true,
      value(this: IDBFactory, name: string, version?: number) {
        if (name !== "casefind-preview") return nativeOpen.call(this, name, version);
        unavailableOpenCount += 1;
        const request: Record<string, unknown> = {
          error: new DOMException("Storage unavailable", "UnknownError"),
        };
        queueMicrotask(() => (request.onerror as ((event: Event) => void) | undefined)?.(new Event("error")));
        return request;
      },
    });
    Object.defineProperty(globalThis, "__casefindUnavailableOpenCount", {
      configurable: true,
      get: () => unavailableOpenCount,
    });
  });
}

async function prepareBlockedOpen(page: import("playwright/test").Page) {
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
        if (!blockNextCaseOpen || name !== "casefind-preview" || version !== 6) {
          return nativeOpen.call(this, name, version);
        }
        blockNextCaseOpen = false;
        blockedOpenCount += 1;
        const request: Record<string, unknown> = {};
        queueMicrotask(() => (request.onblocked as ((event: Event) => void) | undefined)?.(new Event("blocked")));
        return request;
      },
    });
    Object.defineProperty(globalThis, "__casefindBlockedOpenCount", {
      configurable: true,
      get: () => blockedOpenCount,
    });
  });
}

test("unavailable navigation and steps settle", async ({ page }) => {
  try {
    await installUnavailableOpen(page);
    await page.goto("/cases-new.html");
    expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindUnavailableOpenCount: number }).__casefindUnavailableOpenCount)).toBe(0);
    await completeIntake(page, "Unavailable phase diagnostic");
    await expect(page.locator("#case-title")).toHaveValue("Unavailable phase diagnostic");
    await expect(page.locator("#local-storage-ack")).toBeChecked();
  } finally {
    await closeDiagnosticPage(page);
  }
});

test("unavailable callback and recovery state settle", async ({ page }) => {
  try {
    await installUnavailableOpen(page);
    await page.goto("/cases-new.html");
    await completeIntake(page, "Unavailable phase diagnostic");
    await submitIntake(page);
    await expect(page.locator("#creation-error")).toHaveAttribute("data-state", "unavailable");
    await expect(page.locator("#continue-button")).toBeEnabled();
    await expect(page.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
    expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindUnavailableOpenCount: number }).__casefindUnavailableOpenCount)).toBe(1);
  } finally {
    await closeDiagnosticPage(page);
  }
});

test("unavailable recovery assertions and explicit close settle", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  try {
    await installUnavailableOpen(page);
    await page.goto("/cases-new.html");
    await completeIntake(page, "Unavailable phase diagnostic");
    await submitIntake(page);
    const recovery = page.locator("#creation-error");
    await expect(recovery).toHaveAttribute("data-state", "unavailable");
    await expect(recovery).toContainText("Your entries are still here");
    await expect(recovery).toContainText("Nothing was changed or deleted");
    await expect(recovery).toContainText("Do not clear site data");
    await expect(page.locator("#created-state")).toBeHidden();
    await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
    await expect(page.locator("#case-title")).toHaveValue("Unavailable phase diagnostic");
    await expect(page.locator('input[name="goal"][value="request"]')).toBeChecked();
    await expect(page.locator("#local-storage-ack")).toBeChecked();
    await expect(page.locator("#continue-button")).toHaveAttribute("aria-describedby", "creation-error");
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  } finally {
    await closeDiagnosticPage(page);
  }
});

test("blocked setup and recovery state settle", async ({ page }) => {
  try {
    await prepareBlockedOpen(page);
    await page.goto("/cases-new.html");
    await completeIntake(page, "Blocked phase diagnostic");
    await submitIntake(page);
    await expect(page.locator("#creation-error")).toHaveAttribute("data-state", "blocked");
    await expect(page.locator("#continue-button")).toBeEnabled();
    await expect(page.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
    expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindBlockedOpenCount: number }).__casefindBlockedOpenCount)).toBe(1);
  } finally {
    await closeDiagnosticPage(page);
  }
});

test("blocked retry and verification settle", async ({ page }) => {
  try {
    await prepareBlockedOpen(page);
    await page.goto("/cases-new.html");
    await completeIntake(page, "Blocked phase diagnostic");
    await submitIntake(page);
    await expect(page.locator("#creation-error")).toHaveAttribute("data-state", "blocked");
    await submitIntake(page);
    await expect(page.locator("#created-state")).toBeVisible();
    const cases = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("casefind-preview", 6);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Database read blocked"));
      });
      const values = await new Promise<unknown[]>((resolve, reject) => {
        const request = db.transaction("cases").objectStore("cases").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return values;
    });
    expect(cases).toHaveLength(1);
    expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindBlockedOpenCount: number }).__casefindBlockedOpenCount)).toBe(1);
  } finally {
    await closeDiagnosticPage(page);
  }
});
