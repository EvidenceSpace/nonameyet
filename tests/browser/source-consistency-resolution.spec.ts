import { expect, test, type Locator, type Page } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

async function addAgreedPriceFact(page: Page, row: Locator, value: string) {
  await row.locator(".source-file").click();
  const dialog = page.locator("#fact-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#fact-type").selectOption("agreed_price");
  await dialog.locator("#fact-value").fill(value);
  await dialog.locator("button[type='submit']").click();
  await expect(dialog).toBeHidden();
}

test("reviews a verified cross-source difference without rewriting either fact", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Source consistency review");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("6000");
  await page.locator("#summary").fill("A synthetic case used to verify explicit resolution of source differences.");
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
  await expect(proposal).toBeVisible();
  await expect(invoice).toBeVisible();
  await addAgreedPriceFact(page, proposal, "5,000");
  await addAgreedPriceFact(page, invoice, "6,000");

  const card = page.locator(".consistency-item");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Agreed price");
  await expect(card).toContainText("5,000");
  await expect(card).toContainText("6,000");
  await expect(card).toContainText("Needs comparison");
  await expect(page.locator("#nav-conflict-count")).toHaveText("1");
  await expect(page.locator("#consistency-summary")).toContainText("1needs review");

  await card.locator(".consistency-source", { hasText: "Open source" }).first().click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  await expect(preview.locator("#preview-title")).toHaveText("proposal.png");
  await preview.locator("#close-preview").click();

  await card.locator(".consistency-review").click();
  const dialog = page.locator(".consistency-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("button[type='submit']").click();
  await expect(dialog.locator(".consistency-error")).toHaveText("Choose one of the source-linked values.");
  await dialog.getByLabel(/Use “6,000” in this case record/).check();
  await dialog.locator("#consistency-note").fill("The later invoice is the current amount for this case.");
  await dialog.locator("button[type='submit']").click();

  await expect(dialog).toBeHidden();
  await expect(page.locator(".consistency-status")).toHaveText(
    "Consistency review saved locally. Verified facts and sources were not changed.",
  );
  await expect(card).toHaveClass(/resolved/);
  await expect(card).toContainText("Selected: 6,000");
  await expect(card).toContainText("The later invoice is the current amount for this case.");
  await expect(page.locator("#nav-conflict-count")).toHaveText("0");
  await expect(page.locator(".fact-record")).toHaveCount(2);
  await expect(page.locator(".file-row")).toHaveCount(2);

  await page.reload();
  await expect(page.locator(".consistency-item.resolved")).toHaveCount(1);
  await expect(page.locator(".consistency-item.resolved")).toContainText("Selected: 6,000");
  await expect(page.locator(".consistency-item.resolved")).toContainText(
    "The later invoice is the current amount for this case.",
  );
  await expect(page.locator(".fact-record")).toHaveCount(2);
  await expect(page.locator(".file-row")).toHaveCount(2);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
