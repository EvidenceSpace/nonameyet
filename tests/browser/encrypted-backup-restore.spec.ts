import { expect, test } from "playwright/test";

const caseTitle = "Encrypted recovery lifecycle";
const backupPassword = "correct horse battery staple";

test.setTimeout(90_000);

test("backs up, permanently deletes, and restores a local case", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(caseTitle);
  await page.locator("#client").fill("Recovery test client");
  await page.locator("#amount").fill("18000");
  await page.locator("#summary").fill("The work was delivered and this case verifies complete encrypted local recovery.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  const invoiceStatus = page.locator('#workspace-checklist select[data-key="invoice"]');
  await expect(invoiceStatus).toBeVisible();
  await invoiceStatus.selectOption("found");
  await expect(page.getByText("Saved on this device.")).toBeVisible();

  await page.getByRole("button", { name: "Backup case" }).click();
  const backupDialog = page.locator(".backup-dialog");
  await expect(backupDialog).toBeVisible();
  await backupDialog.locator("#backup-password").fill(backupPassword);
  await backupDialog.locator("#backup-confirm").fill(backupPassword);
  await backupDialog.locator("#backup-ack").check();
  await expect(backupDialog.locator("#create-backup")).toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await backupDialog.locator("#create-backup").click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath("encrypted-recovery.casefind");
  await download.saveAs(backupPath);
  await expect(backupDialog).toBeHidden();

  await page.getByRole("button", { name: "Delete case" }).click();
  const deleteDialog = page.locator("#delete-dialog");
  await expect(deleteDialog).toHaveAttribute("data-enhanced", "true");
  await deleteDialog.locator("#workspace-delete-title").fill(caseTitle);
  await deleteDialog.locator("#workspace-delete-ack").check();
  await expect(deleteDialog.locator("#workspace-confirm-delete")).toBeEnabled();
  await deleteDialog.locator("#workspace-confirm-delete").click();
  await expect(page).toHaveURL(/cases\.html$/);
  await expect(page.getByText(caseTitle, { exact: true })).toHaveCount(0);

  await page.goto("/cases-new.html#restore");
  const restoreDialog = page.locator(".restore-dialog");
  await expect(restoreDialog).toBeVisible();
  await restoreDialog.locator("#restore-file").setInputFiles(backupPath);
  await restoreDialog.locator("#restore-password").fill(backupPassword);
  await restoreDialog.locator("#restore-submit").click();

  await expect(page).toHaveURL(/case\.html\?id=/);
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-title")).toHaveText(caseTitle);
  await expect(page.locator('#workspace-checklist select[data-key="invoice"]')).toHaveValue("found");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
