import { readFile, writeFile } from "node:fs/promises";
import { expect, test } from "playwright/test";

const caseTitle = "Encrypted recovery lifecycle";
const backupPassword = "correct horse battery staple";
const safeRecoveryError = "The password is incorrect, or the backup was changed or damaged.";

test.setTimeout(90_000);

test("backs up, rejects unsafe recovery attempts, deletes, and restores a local case", async ({ page }, testInfo) => {
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

  await page.locator(".backup-trigger").click();
  const backupDialog = page.locator(".backup-dialog");
  await expect(backupDialog).toBeVisible();
  await expect(backupDialog.locator("#backup-summary")).not.toContainText("Loading local case details");
  await expect(backupDialog.locator("#backup-error")).toHaveText("");
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

  const envelope = JSON.parse(await readFile(backupPath, "utf8"));
  const mutationIndex = Math.floor(envelope.ciphertext.length / 2);
  envelope.ciphertext = `${envelope.ciphertext.slice(0, mutationIndex)}${envelope.ciphertext[mutationIndex] === "A" ? "B" : "A"}${envelope.ciphertext.slice(mutationIndex + 1)}`;
  const tamperedPath = testInfo.outputPath("tampered-recovery.casefind");
  await writeFile(tamperedPath, JSON.stringify(envelope), { mode: 0o600 });

  await page.locator("#delete-case").click();
  const deleteDialog = page.locator("#delete-dialog");
  await expect(deleteDialog).toHaveAttribute("data-enhanced", "true");
  await deleteDialog.locator("#workspace-delete-title").fill(caseTitle);
  await deleteDialog.locator("#workspace-delete-ack").check();
  await expect(deleteDialog.locator("#workspace-confirm-delete")).toBeEnabled();
  await deleteDialog.locator("#workspace-confirm-delete").click();
  await expect(page).toHaveURL(/cases\.html$/);

  await page.goto("/cases-new.html#restore");
  const restoreDialog = page.locator(".restore-dialog");
  const restoreFile = restoreDialog.locator("#restore-file");
  const restorePassword = restoreDialog.locator("#restore-password");
  const restoreSubmit = restoreDialog.locator("#restore-submit");
  const restoreError = restoreDialog.locator("#restore-error");
  await expect(restoreDialog).toBeVisible();

  await restoreFile.setInputFiles(backupPath);
  await restorePassword.fill("definitely wrong password");
  await restoreSubmit.click();
  await expect(restoreError).toHaveText(safeRecoveryError);
  await expect(restorePassword).toHaveValue("");
  await expect(page).toHaveURL(/cases-new\.html#restore$/);

  await restoreFile.setInputFiles(tamperedPath);
  await restorePassword.fill(backupPassword);
  await restoreSubmit.click();
  await expect(restoreError).toHaveText(safeRecoveryError);
  await expect(restorePassword).toHaveValue("");
  await expect(page).toHaveURL(/cases-new\.html#restore$/);

  await restoreFile.setInputFiles(backupPath);
  await restorePassword.fill(backupPassword);
  await restoreSubmit.click();

  await expect(page).toHaveURL(/case\.html\?id=/);
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-title")).toHaveText(caseTitle);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
