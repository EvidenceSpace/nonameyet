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
  await goal.check();
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  const acknowledgement = page.locator("#local-storage-ack");
  await expect(acknowledgement).toBeVisible();
  await acknowledgement.check();
}

async function closeBlocker(page: import("playwright/test").Page) {
  await page.evaluate(() => {
    const state = globalThis as typeof globalThis & { __casefindIntakeBlocker?: IDBDatabase };
    state.__casefindIntakeBlocker?.close();
  });
}

async function closeBlockerAndWaitForUpgrade(page: import("playwright/test").Page) {
  await closeBlocker(page);
  await expect.poll(() => page.evaluate(async () => {
    const database = (await indexedDB.databases()).find(({ name }) => name === "casefind-preview");
    return database?.version ?? 0;
  })).toBe(6);
}

async function submitIntake(page: import("playwright/test").Page) {
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
}

async function clearDraft(page: import("playwright/test").Page) {
  if (page.isClosed()) return;
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.reset());
}

test("keeps intake entries through a blocked upgrade and retries one draft", async ({ context, page }) => {
  let intake: import("playwright/test").Page | undefined;
  let blockerClosed = false;
  try {
    await page.goto("/index.html");
    await page.evaluate(async () => {
      await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase("casefind-preview"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error("Database deletion blocked")); });
      const blocker = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("casefind-preview", 5); request.onupgradeneeded = () => request.result.createObjectStore("cases", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error("Database creation blocked")); });
      Object.defineProperty(globalThis, "__casefindIntakeBlocker", { configurable: true, value: blocker });
    });
    await expect.poll(() => page.evaluate(async () => {
      const database = (await indexedDB.databases()).find(({ name }) => name === "casefind-preview");
      return database?.version ?? 0;
    })).toBe(5);

    intake = await context.newPage();
    const pageErrors: string[] = [];
    const externalRequests: string[] = [];
    intake.on("pageerror", (error) => pageErrors.push(error.message));
    intake.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
    await intake.goto("/cases-new.html");
    await completeIntake(intake, "Blocked draft remains here");
    const submit = intake.locator("#continue-button");
    await expect(submit).toBeEnabled();
    await submitIntake(intake);
    const recovery = intake.locator("#creation-error");
    await expect(recovery).toHaveAttribute("data-state", "blocked");
    await expect(recovery).toContainText("Your entries are still here and no case was changed");
    await expect(intake.locator("#case-title")).toHaveValue("Blocked draft remains here");
    await expect(intake.locator('input[name="goal"][value="request"]')).toBeChecked();
    await expect(intake.locator("#local-storage-ack")).toBeChecked();
    await expect(submit).toContainText("Try saving again");
    await expect(submit).toBeEnabled();
    await expect(intake.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");

    await closeBlockerAndWaitForUpgrade(page);
    blockerClosed = true;
    await submitIntake(intake);
    await expect(intake.locator("#created-state")).toBeVisible();
    const cases = await intake.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open("casefind-preview", 6); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); request.onblocked = () => reject(new Error("Database read blocked")); });
      const values = await new Promise<unknown[]>((resolve, reject) => { const request = db.transaction("cases").objectStore("cases").getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      db.close(); return values;
    });
    expect(cases).toHaveLength(1);
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  } finally {
    if (!blockerClosed) await closeBlocker(page).catch(() => undefined);
    if (intake && !intake.isClosed()) {
      await clearDraft(intake).catch(() => undefined);
      await intake.close({ runBeforeUnload: false }).catch(() => undefined);
    }
  }
});
