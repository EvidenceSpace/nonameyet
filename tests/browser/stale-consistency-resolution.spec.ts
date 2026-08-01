import { expect, test, type Locator, type Page } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function addPriceFact(page: Page, row: Locator, value: string) {
  await row.locator(".source-file").click();
  const dialog = page.locator("#fact-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#fact-type").selectOption("agreed_price");
  await dialog.locator("#fact-value").fill(value);
  await dialog.locator("button[type='submit']").click();
  await expect(dialog).toBeHidden();
}

test("reopens a resolved comparison when participating facts change", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Stale consistency decision");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("6000");
  await page.locator("#summary").fill("A synthetic case used to verify stale comparison decisions fail closed.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").setInputFiles([
    { name: "proposal.png", mimeType: "image/png", buffer: imageBytes },
    { name: "invoice.png", mimeType: "image/png", buffer: Buffer.concat([imageBytes, Buffer.from([0])]) },
  ]);
  const proposal = page.locator(".file-row", { hasText: "proposal.png" });
  const invoice = page.locator(".file-row", { hasText: "invoice.png" });
  await addPriceFact(page, proposal, "5,000");
  await addPriceFact(page, invoice, "6,000");

  const card = page.locator(".consistency-item");
  await expect(card).toHaveClass(/unresolved/);
  await card.locator(".consistency-review").click();
  const dialog = page.locator(".consistency-dialog");
  await dialog.getByLabel(/These values may both be contextual/).check();
  await dialog.locator("#consistency-note").fill("The values may reflect different project phases.");
  await dialog.locator("button[type='submit']").click();
  await expect(dialog).toBeHidden();
  await expect(card).toHaveClass(/resolved/);
  await expect(card).toContainText("Reviewed as contextual");
  await expect(card).toContainText("The values may reflect different project phases.");
  await expect(page.locator("#nav-conflict-count")).toHaveText("0");

  await addPriceFact(page, invoice, "7,000");
  await expect(card).toHaveClass(/unresolved/);
  await expect(card).toContainText("Needs comparison");
  await expect(card).toContainText("5,000");
  await expect(card).toContainText("6,000");
  await expect(card).toContainText("7,000");
  await expect(card).not.toContainText("The values may reflect different project phases.");
  await expect(page.locator("#nav-conflict-count")).toHaveText("1");
  await expect(page.locator(".fact-record")).toHaveCount(3);
  await expect(page.locator(".file-row")).toHaveCount(2);

  await page.reload();
  const reopened = page.locator(".consistency-item.unresolved");
  await expect(reopened).toHaveCount(1);
  await expect(reopened).toContainText("Needs comparison");
  await expect(reopened).toContainText("7,000");
  await expect(reopened).not.toContainText("The values may reflect different project phases.");
  await expect(page.locator("#nav-conflict-count")).toHaveText("1");
  await expect(page.locator(".fact-record")).toHaveCount(3);
  await expect(page.locator(".file-row")).toHaveCount(2);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
