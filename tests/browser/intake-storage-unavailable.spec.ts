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

test("keeps the complete form open when local storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeOpen = IDBFactory.prototype.open;
    let unavailableOpenCount = 0;
    Object.defineProperty(IDBFactory.prototype, "open", {
      configurable: true,
      writable: true,
      value(this: IDBFactory, name: string, version?: number) {
        if (name !== "casefind-preview") return nativeOpen.call(this, name, version);
        unavailableOpenCount += 1;
        const request: Record<string, unknown> = { error: new DOMException("Storage unavailable", "UnknownError") };
        queueMicrotask(() => (request.onerror as ((event: Event) => void) | undefined)?.(new Event("error")));
        return request;
      },
    });
    Object.defineProperty(globalThis, "__casefindUnavailableOpenCount", { configurable: true, get: () => unavailableOpenCount });
  });
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });

  await page.goto("/cases-new.html");
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindUnavailableOpenCount: number }).__casefindUnavailableOpenCount)).toBe(0);
  await completeIntake(page, "Unavailable storage draft");
  const submit = page.locator("#continue-button");
  await expect(submit).toBeEnabled();
  await submitIntake(page);
  const recovery = page.locator("#creation-error");
  await expect(recovery).toHaveAttribute("data-state", "unavailable");
  await expect(recovery).toContainText("Your entries are still here");
  await expect(recovery).toContainText("Nothing was changed or deleted");
  await expect(recovery).toContainText("Do not clear site data");
  await expect(page.locator("#created-state")).toBeHidden();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  await expect(page.locator("#case-title")).toHaveValue("Unavailable storage draft");
  await expect(page.locator("#summary")).toHaveValue("The agreed work was delivered and the remaining payment has not been received.");
  await expect(page.locator('input[name="goal"][value="request"]')).toBeChecked();
  await expect(page.locator("#local-storage-ack")).toBeChecked();
  await expect(submit).toHaveAttribute("aria-describedby", "creation-error");
  await expect(submit).toBeEnabled();
  await expect(page.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __casefindUnavailableOpenCount: number }).__casefindUnavailableOpenCount)).toBe(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.reset());
  await page.close({ runBeforeUnload: false });
});
