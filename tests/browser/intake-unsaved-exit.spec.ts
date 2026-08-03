import { expect, test } from "playwright/test";

async function dispatchBeforeUnload(page: import("playwright/test").Page) {
  return page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    return window.dispatchEvent(event);
  });
}

test("warns only while meaningful intake entries are unsaved", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await page.goto("/cases-new.html");
  await expect(page.locator("#draft-storage-status")).toHaveAttribute("data-state", "pristine");
  expect(await dispatchBeforeUnload(page)).toBe(true);
  await page.locator("#case-title").fill("Unsaved browser draft");
  await expect(page.locator("#draft-storage-status")).toHaveAttribute("data-state", "unsaved");
  await expect(page.locator("#draft-storage-status")).toContainText("leaving this page will discard");
  expect(await dispatchBeforeUnload(page)).toBe(false);
  await page.locator("#case-title").fill("");
  await expect(page.locator("#draft-storage-status")).toHaveAttribute("data-state", "pristine");
  expect(await dispatchBeforeUnload(page)).toBe(true);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("removes the exit warning after the case is saved", async ({ page }) => {
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Saved exit lifecycle");
  await page.locator("#client").fill("Example client");
  await page.locator("#summary").fill("The work was completed and the remaining payment has not been received.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await expect(page.locator("#created-state")).toBeVisible();
  expect(await dispatchBeforeUnload(page)).toBe(true);
});
