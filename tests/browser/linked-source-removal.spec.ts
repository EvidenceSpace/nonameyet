import { expect, test } from "playwright/test";

const sourceBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("blocks source removal until its confirmed fact is removed", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Linked source removal guard");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case used to verify source-linked fact integrity.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles({
    name: "linked-source.png",
    mimeType: "image/png",
    buffer: sourceBytes,
  });
  const row = page.locator(".file-row");
  await expect(row).toHaveCount(1);
  await row.locator(".source-file").click();
  const factDialog = page.locator("#fact-dialog");
  await expect(factDialog).toBeVisible();
  await factDialog.locator("#fact-value").fill("Payment remains outstanding");
  await factDialog.locator("#fact-note").fill("User-reviewed context");
  await factDialog.locator("button[type='submit']").click();
  await expect(page.locator(".fact-record")).toHaveCount(1);
  await expect(page.locator(".fact-record")).toContainText("Source: linked-source.png");

  await row.locator(".delete-file").click();
  await expect(page.locator("#upload-message")).toHaveText(
    "Resolve or remove linked facts and suggestions before deleting this source record.",
  );
  await expect(row).toHaveCount(1);
  await expect(page.locator(".fact-record")).toHaveCount(1);

  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator(".file-row")).toHaveCount(1);
  await expect(page.locator(".fact-record")).toHaveCount(1);
  await expect(page.locator(".fact-record")).toContainText("Payment remains outstanding");

  await page.locator(".fact-record .delete-fact").click();
  await expect(page.locator(".fact-record")).toHaveCount(0);
  await page.locator(".file-row .delete-file").click();
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("0");

  await page.reload();
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
