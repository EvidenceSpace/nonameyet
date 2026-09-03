import { expect, test } from "playwright/test";

test.describe.configure({ retries: 0 });
test.setTimeout(20_000);
test.skip(process.env.INTAKE_DIAGNOSTIC !== "1", "Temporary intake recovery diagnostic");

async function completeIntake(page: import("playwright/test").Page, title: string) {
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("12500");
  await page.locator("#summary").fill("The agreed work was delivered and the remaining payment has not been received.");
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 2 of 3");
  const goal = page.locator('input[name="goal"][value="request"]');
  await page.locator(".goal-card", { hasText: "Prepare a payment request" }).click();
  await expect(goal).toBeChecked();
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  const acknowledgement = page.locator("#local-storage-ack");
  await page.locator("label.local-data-ack").click();
  await expect(acknowledgement).toBeChecked();
}

async function submitIntake(page: import("playwright/test").Page) {
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
}

async function installUnavailableStorage(page: import("playwright/test").Page) {
  await page.addInitScript(() => {
    const unavailable = {
      open() {
        const request: Record<string, unknown> = {
          error: new DOMException("Storage unavailable", "UnknownError"),
        };
        queueMicrotask(() => (request.onerror as (() => void) | undefined)?.());
        return request;
      },
    };
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: unavailable });
  });
}

async function prepareBlockedStorage(context: import("playwright/test").BrowserContext, page: import("playwright/test").Page) {
  await page.goto("/index.html");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("casefind-preview");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database deletion blocked"));
    });
    const blocker = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("casefind-preview", 5);
      request.onupgradeneeded = () => request.result.createObjectStore("cases", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Database creation blocked"));
    });
    Object.defineProperty(globalThis, "__casefindDiagnosticBlocker", { configurable: true, value: blocker });
  });
  const intake = await context.newPage();
  await intake.goto("/cases-new.html");
  return intake;
}

async function closeBlockerAndWaitForUpgrade(page: import("playwright/test").Page) {
  await page.evaluate(() => {
    (globalThis as typeof globalThis & { __casefindDiagnosticBlocker: IDBDatabase }).__casefindDiagnosticBlocker.close();
  });
  await expect.poll(() => page.evaluate(async () => {
    const database = (await indexedDB.databases()).find(({ name }) => name === "casefind-preview");
    return database?.version ?? 0;
  })).toBe(6);
}

test("intake form steps settle", async ({ page }) => {
  await page.goto("/cases-new.html");
  await completeIntake(page, "Intake phase diagnostic");
  await expect(page.locator("#case-title")).toHaveValue("Intake phase diagnostic");
  await expect(page.locator('input[name="goal"][value="request"]')).toBeChecked();
  await expect(page.locator("#local-storage-ack")).toBeChecked();
});

test("unavailable recovery state settles", async ({ page }) => {
  await installUnavailableStorage(page);
  await page.goto("/cases-new.html");
  await completeIntake(page, "Unavailable phase diagnostic");
  await submitIntake(page);
  await expect(page.locator("#creation-error")).toHaveAttribute("data-state", "unavailable");
  await expect(page.locator("#continue-button")).toBeEnabled();
  await expect(page.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
});

test("unavailable preservation assertions settle", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installUnavailableStorage(page);
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
  expect(pageErrors).toEqual([]);
});

test("blocked recovery state settles", async ({ context, page }) => {
  const intake = await prepareBlockedStorage(context, page);
  try {
    await completeIntake(intake, "Blocked phase diagnostic");
    await submitIntake(intake);
    await expect(intake.locator("#creation-error")).toHaveAttribute("data-state", "blocked");
    await expect(intake.locator("#continue-button")).toBeEnabled();
    await expect(intake.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
  } finally {
    await page.evaluate(() => {
      (globalThis as typeof globalThis & { __casefindDiagnosticBlocker: IDBDatabase }).__casefindDiagnosticBlocker.close();
    });
    await intake.close({ runBeforeUnload: false });
  }
});

test("blocked retry reaches a stored draft", async ({ context, page }) => {
  const intake = await prepareBlockedStorage(context, page);
  try {
    await completeIntake(intake, "Blocked retry diagnostic");
    await submitIntake(intake);
    await expect(intake.locator("#creation-error")).toHaveAttribute("data-state", "blocked");
    await closeBlockerAndWaitForUpgrade(page);
    await submitIntake(intake);
    await expect(intake.locator("#created-state")).toBeVisible();
    const cases = await intake.evaluate(async () => {
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
  } finally {
    await intake.close({ runBeforeUnload: false }).catch(() => undefined);
  }
});
