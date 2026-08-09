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

async function clearDraft(page: import("playwright/test").Page) {
  if (page.isClosed()) return;
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.reset());
}

test("keeps the complete form open when local storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: {
        open() {
          throw new DOMException("Storage unavailable", "UnknownError");
        },
      },
    });
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.goto("/cases-new.html");
    const injectedFailure = await page.evaluate(() => {
      try {
        indexedDB.open("casefind-storage-probe");
        return null;
      } catch (cause) {
        return cause instanceof DOMException
          ? { name: cause.name, message: cause.message }
          : { name: "UnexpectedError", message: String(cause) };
      }
    });
    expect(injectedFailure).toEqual({ name: "UnknownError", message: "Storage unavailable" });

    await completeIntake(page, "Unavailable storage draft");
    const submit = page.locator("#continue-button");
    await expect(submit).toBeEnabled();
    await submit.click();
    const recovery = page.locator("#creation-error");
    await expect(recovery).toHaveAttribute("data-state", "unavailable");
    await expect(recovery).toContainText("Your entries are still here");
    await expect(recovery).toContainText("Nothing was changed or deleted");
    await expect(recovery).toContainText("Do not clear site data");
    await expect(page.locator("#created-state")).toBeHidden();
    await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
    await expect(page.locator("#case-title")).toHaveValue("Unavailable storage draft");
    await expect(page.locator("#summary")).toHaveValue("The agreed work was delivered and the remaining payment has not been received.");
    await expect(submit).toHaveAttribute("aria-describedby", "creation-error");
    await expect(submit).toBeEnabled();
    await expect(page.locator("#intake-form")).not.toHaveAttribute("aria-busy", "true");
    expect(pageErrors).toEqual([]);
  } finally {
    await clearDraft(page).catch(() => undefined);
  }
});
