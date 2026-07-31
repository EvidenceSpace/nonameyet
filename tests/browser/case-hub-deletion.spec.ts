import { expect, test, type Page } from "playwright/test";

async function createCase(page: Page, title: string) {
  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(title);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill(`A synthetic case used to verify guarded deletion for ${title}.`);
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
}

test("permanently deletes only the confirmed local case from the hub", async ({ page }) => {
  const targetTitle = "Delete only this case";
  const retainedTitle = "Keep this case";
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await createCase(page, targetTitle);
  await createCase(page, retainedTitle);
  await page.goto("/cases.html");

  const targetCard = page.locator(".local-case-card", { hasText: targetTitle });
  const retainedCard = page.locator(".local-case-card", { hasText: retainedTitle });
  const dialog = page.locator(".case-delete-dialog");
  await expect(targetCard).toBeVisible();
  await expect(retainedCard).toBeVisible();
  await expect(page.locator("#library-count")).toHaveText("2");

  await targetCard.locator(".delete-case-trigger").click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#delete-case-title")).toHaveText(`Delete “${targetTitle}”?`);
  await expect(dialog.locator("#delete-backup-warning")).toContainText("No encrypted backup is recorded");
  const confirmation = dialog.locator("#delete-title-confirmation");
  const acknowledgment = dialog.locator("#delete-case-ack");
  const submit = dialog.locator("#confirm-case-delete");
  await confirmation.fill("Delete the wrong case");
  await acknowledgment.check();
  await expect(submit).toBeDisabled();
  await dialog.locator(".delete-cancel").click();
  await expect(dialog).toBeHidden();
  await expect(targetCard).toBeVisible();
  await expect(retainedCard).toBeVisible();

  await targetCard.locator(".delete-case-trigger").click();
  await confirmation.fill(targetTitle);
  await acknowledgment.check();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(dialog).toBeHidden();
  await expect(targetCard).toHaveCount(0);
  await expect(retainedCard).toBeVisible();
  await expect(page.locator("#library-count")).toHaveText("1");

  await page.reload();
  await expect(page.locator(".local-case-card", { hasText: targetTitle })).toHaveCount(0);
  await expect(page.locator(".local-case-card", { hasText: retainedTitle })).toBeVisible();
  await expect(page.locator("#library-count")).toHaveText("1");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
