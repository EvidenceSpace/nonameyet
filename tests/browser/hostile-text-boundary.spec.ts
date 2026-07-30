import { readFile } from "node:fs/promises";
import { expect, test } from "playwright/test";

const hostileTitle = '<img src=x onerror="window.__casefindXss=1">';

test("user-controlled text stays inert from intake through library and export", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const suspiciousRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/x" || ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1")) {
      suspiciousRequests.push(request.url());
    }
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(hostileTitle);
  await page.locator("#client").fill("Client <svg onload=window.__casefindXss=2>");
  await page.locator("#amount").fill("12500");
  await page.locator("#summary").fill(`The agreed work was delivered, but payment remains outstanding. ${hostileTitle}`);
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();

  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-title")).toHaveText(hostileTitle);
  await expect(page.locator('img[src="x"],svg[onload]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as typeof window & { __casefindXss?: number }).__casefindXss)).toBeUndefined();
  const workspaceUrl = page.url();

  await page.goto("/cases.html");
  await expect(page.getByText(hostileTitle, { exact: true })).toHaveCount(1);
  await expect(page.locator('img[src="x"],svg[onload]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as typeof window & { __casefindXss?: number }).__casefindXss)).toBeUndefined();

  await page.goto(workspaceUrl);
  await expect(page.locator("#workspace")).toBeVisible();
  await page.getByRole("button", { name: "Download report" }).click();
  await expect(page.locator(".report-preflight")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-report").click();
  const download = await downloadPromise;
  const reportPath = testInfo.outputPath("hostile-text-report.html");
  await download.saveAs(reportPath);
  const reportHtml = await readFile(reportPath, "utf8");

  expect(reportHtml).toContain("&lt;img src=x onerror=");
  expect(reportHtml).not.toContain(hostileTitle);
  expect(reportHtml).not.toContain("<svg onload=");
  expect(reportHtml).toContain("default-src 'none'");
  expect(suspiciousRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
