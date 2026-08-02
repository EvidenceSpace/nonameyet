import { expect, test } from "playwright/test";

test("preserves the amount exactly without rendering a guessed currency", async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as typeof globalThis & { __caseFindAmountFrames?: string[] }).__caseFindAmountFrames = [];
    const sample = () => {
      const workspace = document.querySelector<HTMLElement>("#workspace");
      const amount = document.querySelector<HTMLElement>("#workspace-amount");
      if (workspace && amount && !workspace.hidden) {
        (globalThis as typeof globalThis & { __caseFindAmountFrames: string[] }).__caseFindAmountFrames.push(amount.textContent || "");
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

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
  await page.waitForTimeout(50);
  const renderedFrames = await page.evaluate(() => (globalThis as typeof globalThis & { __caseFindAmountFrames?: string[] }).__caseFindAmountFrames || []);
  expect(renderedFrames).not.toContain("₹5000");

  await page.locator(".case-details-trigger").click();
  const dialog = page.locator(".case-details-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#details-amount").fill("EUR 4,500");
  await dialog.locator("button[type='submit']").click();
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-amount")).toHaveText("EUR 4,500");
});
