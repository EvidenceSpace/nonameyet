import { expect, test } from "playwright/test";
import { inspectPdfStructure } from "../../src/report/pdf-inspection.js";

const caseTitle = "Print lifecycle record";

test("previews and renders an inert local A4 report", async ({ page, context }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  context.on("page", (openedPage) => {
    openedPage.on("pageerror", (error) => pageErrors.push(error.message));
  });
  context.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") {
      externalRequests.push(request.url());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill(caseTitle);
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case used to verify local report pagination.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  const reportTrigger = page.locator(".workspace-topline > .button-secondary:not(.backup-trigger)");
  await expect(reportTrigger).toHaveText("Download report");
  await reportTrigger.click();
  const preflight = page.locator(".report-preflight");
  await expect(preflight).toBeVisible();
  await expect(preflight.locator("#report-facts")).toHaveText("0");
  await expect(preflight.locator("#report-pending")).toHaveText("0");

  const popupPromise = page.waitForEvent("popup");
  await preflight.locator("#preview-report").click();
  const preview = await popupPromise;
  await preview.waitForLoadState("domcontentloaded");

  await expect(preview.locator("h1")).toHaveText(caseTitle);
  await expect(preview.locator(".print-guidance")).toContainText("Ready to save as PDF");
  await expect(preview.locator("body")).toContainText("Amount entered: 5000");
  await expect(preview.locator("body")).not.toContainText("₹5000");
  await expect(preview.locator("meta[http-equiv='Content-Security-Policy']")).toHaveAttribute(
    "content",
    /default-src 'none'/,
  );
  await expect(preview.locator("script")).toHaveCount(0);

  await preview.emulateMedia({ media: "print" });
  await expect(preview.locator(".print-guidance")).toBeHidden();
  const pdf = await preview.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true });
  const structure = inspectPdfStructure(pdf);
  expect(structure.hasHeader).toBe(true);
  expect(structure.hasEofMarker).toBe(true);
  expect(structure.hasStartXref).toBe(true);
  expect(structure.byteLength).toBeGreaterThan(5_000);
  expect(structure.pageCount).toBeGreaterThanOrEqual(2);
  expect(structure.pageCount).toBeLessThanOrEqual(3);
  expect(structure.hasEncryption).toBe(false);
  expect(structure.hasJavaScript).toBe(false);
  expect(structure.hasOpenAction).toBe(false);
  expect(structure.hasEmbeddedFiles).toBe(false);

  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
