import { expect, test } from "playwright/test";
import { seedWorkspaceFiles } from "./workspace-file-fixture";

const caseTitle = "Private note export boundary";
const privateNote = 'PRIVATE CONTEXT <img src="https://evil.test/private.png">';
const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("keeps private fact notes out until the user opts in", async ({ page, context }) => {
  const externalRequests: string[] = [];
  const pageErrors: string[] = [];
  context.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });
  context.on("page", (openedPage) => {
    openedPage.on("pageerror", (error) => pageErrors.push(error.message));
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(caseTitle);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("7500");
  await page.locator("#summary").fill("Synthetic case for private-note export testing.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await seedWorkspaceFiles(page, [{ id: "file_report_private_notes", name: "payment-proof.png", mimeType: "image/png", buffer: onePixelPng }]);
  await page.locator(".file-row .source-file").click();
  const factDialog = page.locator("#fact-dialog");
  await expect(factDialog).toBeVisible();
  await factDialog.locator("#fact-value").fill("USD 7,500");
  await factDialog.locator("#fact-note").fill(privateNote);
  await factDialog.locator("button[type='submit']").click();
  await expect(page.locator(".fact-record")).toHaveCount(1);

  const reportTrigger = page.locator(".workspace-topline > .button-secondary:not(.backup-trigger)");
  await expect(reportTrigger).toHaveText("Download report");
  await reportTrigger.click();
  const preflight = page.locator(".report-preflight");
  await expect(preflight).toBeVisible();
  await expect(preflight.locator("#report-notes")).not.toBeChecked();
  await expect(preflight.locator("#report-facts")).toHaveText("1");

  const safePreviewPromise = page.waitForEvent("popup");
  await preflight.locator("#preview-report").click();
  const safePreview = await safePreviewPromise;
  await safePreview.waitForLoadState("domcontentloaded");
  await expect(safePreview.locator("body")).not.toContainText("PRIVATE CONTEXT");
  await expect(safePreview.locator("body")).toContainText("USD 7,500");
  await safePreview.close();

  await preflight.locator("#report-notes").check();
  const includedPreviewPromise = page.waitForEvent("popup");
  await preflight.locator("#preview-report").click();
  const includedPreview = await includedPreviewPromise;
  await includedPreview.waitForLoadState("domcontentloaded");
  await expect(includedPreview.locator("body")).toContainText("PRIVATE CONTEXT");
  await expect(includedPreview.locator(".private-note")).toContainText("Included note");
  await expect(includedPreview.locator("img")).toHaveCount(0);
  const hashes = await includedPreview.locator("code").allTextContents();
  expect(hashes.some((value) => /^[a-f0-9]{64}$/.test(value))).toBe(true);

  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
