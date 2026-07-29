import { readFile } from "node:fs/promises";
import { expect, test } from "playwright/test";

test("creates a local case, preserves checklist state, and exports it honestly", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Browser lifecycle case");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("12500");
  await page.locator("#summary").fill("The agreed work was delivered and the remaining payment has not been received.");

  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 2 of 3");
  await page.locator("#continue-button").click();
  await expect(page.locator("#step-label")).toHaveText("Step 3 of 3");
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();

  await expect(page.locator("#created-state")).toBeVisible();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#workspace-title")).toHaveText("Browser lifecycle case");

  const checklist = page.locator("#workspace-checklist");
  await expect(checklist.locator('select[data-key="invoice"]')).toBeVisible();
  await expect(checklist.locator("select[data-key]")).toHaveCount(6);
  await checklist.locator('select[data-key="invoice"]').selectOption("found");
  await expect(checklist.getByText("Saved on this device.")).toBeVisible();

  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator('#workspace-checklist select[data-key="invoice"]')).toHaveValue("found");
  await expect(page.locator("#check-progress")).toHaveText("1/6");

  await page.getByRole("button", { name: "Download report" }).click();
  await expect(page.locator(".report-preflight")).toBeVisible();
  await expect(page.getByText("All six user-controlled statuses")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-report").click();
  const download = await downloadPromise;
  const reportPath = testInfo.outputPath("verified-record.html");
  await download.saveAs(reportPath);
  const reportHtml = await readFile(reportPath, "utf8");

  expect(reportHtml).toContain("Collection checklist status");
  expect(reportHtml).toContain("Invoice");
  expect(reportHtml).toContain("Found");
  expect(reportHtml).toContain("Missing");
  expect(reportHtml).toContain("default-src 'none'");
  expect(reportHtml).toContain("Original file bytes are not embedded");
  expect(reportHtml).not.toContain("https://evil.test");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("intake remains within a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cases-new.html");
  await expect(page.locator("#intake-form")).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.locator("#continue-button")).toBeVisible();
});
