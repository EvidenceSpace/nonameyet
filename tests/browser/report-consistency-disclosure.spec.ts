import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function addPriceFact(page: Page, row: Locator, value: string) {
  await row.locator(".source-file").click();
  const dialog = page.locator("#fact-dialog");
  await dialog.locator("#fact-type").selectOption("agreed_price");
  await dialog.locator("#fact-value").fill(value);
  await dialog.locator("button[type='submit']").click();
  await expect(dialog).toBeHidden();
}

async function downloadReport(page: Page, path: string) {
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-report").click();
  const download = await downloadPromise;
  await download.saveAs(path);
  return readFile(path, "utf8");
}

test("discloses unresolved and resolved source comparisons without leaking notes by default", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Report consistency disclosure");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("6000");
  await page.locator("#summary").fill("A synthetic case used to verify report disclosure of source comparisons.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();

  await page.locator("#file-input").setInputFiles([
    { name: "proposal.png", mimeType: "image/png", buffer: imageBytes },
    { name: "invoice.png", mimeType: "image/png", buffer: Buffer.concat([imageBytes, Buffer.from([0])]) },
  ]);
  await addPriceFact(page, page.locator(".file-row", { hasText: "proposal.png" }), "5,000");
  await addPriceFact(page, page.locator(".file-row", { hasText: "invoice.png" }), "6,000");
  await expect(page.locator(".consistency-item.unresolved")).toHaveCount(1);

  await page.getByRole("button", { name: "Download report" }).click();
  const preflight = page.locator(".report-preflight");
  await expect(preflight).toBeVisible();
  await expect(preflight.locator("#report-conflicts")).toHaveText("1");
  await expect(preflight.locator("#report-warning")).toContainText("1 source comparison remains unresolved and will be disclosed");
  const unresolvedHtml = await downloadReport(page, testInfo.outputPath("unresolved-comparison.html"));
  expect(unresolvedHtml).toContain("Source consistency review");
  expect(unresolvedHtml).toContain("No comparison decision recorded.");
  expect(unresolvedHtml).toContain("Needs comparison");
  expect(unresolvedHtml).toContain("5,000");
  expect(unresolvedHtml).toContain("6,000");
  expect(unresolvedHtml).toContain("proposal.png");
  expect(unresolvedHtml).toContain("invoice.png");

  const comparison = page.locator(".consistency-item");
  await comparison.locator(".consistency-review").click();
  const review = page.locator(".consistency-dialog");
  await review.getByLabel(/Use “6,000” in this case record/).check();
  await review.locator("#consistency-note").fill("PRIVATE CURRENT-AMOUNT NOTE");
  await review.locator("button[type='submit']").click();
  await expect(comparison).toHaveClass(/resolved/);

  await page.getByRole("button", { name: "Download report" }).click();
  await expect(preflight.locator("#report-conflicts")).toHaveText("0");
  const safeHtml = await downloadReport(page, testInfo.outputPath("resolved-comparison.html"));
  expect(safeHtml).toContain("Selected for the organized record");
  expect(safeHtml).toContain("User selected “6,000” for the organized record.");
  expect(safeHtml).toContain("5,000");
  expect(safeHtml).toContain("6,000");
  expect(safeHtml).not.toContain("PRIVATE CURRENT-AMOUNT NOTE");

  await page.getByRole("button", { name: "Download report" }).click();
  await preflight.locator("#report-consistency-notes").check();
  const optedInHtml = await downloadReport(page, testInfo.outputPath("resolved-comparison-with-note.html"));
  expect(optedInHtml).toContain("Included comparison note:");
  expect(optedInHtml).toContain("PRIVATE CURRENT-AMOUNT NOTE");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
