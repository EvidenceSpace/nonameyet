import { expect, test } from "playwright/test";

const caseTitle = "Archive lifecycle case";

test("archives and restores a local case through the action-oriented hub", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(caseTitle);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case used to verify reversible local archiving.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.goto("/cases.html");
  const card = page.locator(".local-case-card", { hasText: caseTitle });
  const activeTab = page.locator(".library-view-tabs button[data-view='active']");
  const archivedTab = page.locator(".library-view-tabs button[data-view='archived']");
  await expect(card).toBeVisible();
  await expect(activeTab.locator("span")).toHaveText("1");
  await expect(archivedTab.locator("span")).toHaveText("0");

  await card.locator(".archive-case-trigger").click();
  await expect(card).toBeHidden();
  await expect(activeTab.locator("span")).toHaveText("0");
  await expect(archivedTab.locator("span")).toHaveText("1");
  await expect(page.locator(".library-view-empty")).toContainText("No active cases");

  await archivedTab.click();
  await expect(card).toBeVisible();
  await expect(card.locator(".archived-marker")).toHaveText("Archived");
  const restoreAction = card.locator(".case-next-action.restore");
  await expect(restoreAction).toContainText("Restore case to continue");
  await restoreAction.click();
  await expect(card).toBeHidden();
  await expect(archivedTab.locator("span")).toHaveText("0");
  await expect(page.locator(".library-view-empty")).toContainText("No archived cases");

  await activeTab.click();
  await expect(card).toBeVisible();
  await expect(card.locator(".archived-marker")).toHaveCount(0);
  await expect(card.locator(".case-next-action")).toContainText("Add the first record");

  await page.reload();
  await expect(page.locator(".local-case-card", { hasText: caseTitle })).toBeVisible();
  await expect(page.locator(".library-view-tabs button[data-view='active'] span")).toHaveText("1");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
