import { expect, test } from "playwright/test";

test("preserves the amount exactly as the user entered it", async ({ page }) => {
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Currency-neutral amount");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that CaseFind never guesses a currency.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-amount")).toHaveText("5000");
  await expect(page.locator("#workspace-amount")).not.toContainText("₹");

  await page.locator(".case-details-trigger").click();
  const dialog = page.locator(".case-details-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#details-amount").fill("EUR 4,500");
  await dialog.locator("button[type='submit']").click();
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-amount")).toHaveText("EUR 4,500");
});
