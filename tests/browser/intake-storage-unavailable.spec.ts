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
  await page.locator("#intake-form").evaluate((form: HTMLFormElement) => form.reset());
}

test("keeps the complete form open when local storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(indexedDB, "open", { configurable: true, value() { throw new DOMException("Storage unavailable", "UnknownError"); } });
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/cases-new.html");
  await completeIntake(page, "Unavailable storage draft");
  await page.locator("#continue-button").click();
  const recovery = page.locator("#creation-error");
  await expect(recovery).toHaveAttribute("data-state", "unavailable");
  await expect(recovery).toContainText("Your entries are still here");
  await expect(recovery).toContainText("Nothing was changed or deleted");
  await expect(recovery).toContainText("Do not clear site data");
  await expect(page.locator("#created-state")).toBeHidden();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  await expect(page.locator("#case-title")).toHaveValue("Unavailable storage draft");
  await expect(page.locator("#summary")).toHaveValue("The agreed work was delivered and the remaining payment has not been received.");
  await expect(page.locator("#continue-button")).toHaveAttribute("aria-describedby", "creation-error");
  expect(pageErrors).toEqual([]);
  await clearDraft(page);
});
