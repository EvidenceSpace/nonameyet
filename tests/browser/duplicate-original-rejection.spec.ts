import { expect, test } from "playwright/test";

const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test("rejects duplicate original bytes without creating partial state", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Duplicate original boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that duplicate source bytes are stored only once.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });

  await page.locator("#file-input").setInputFiles({
    name: "proposal.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  const message = page.locator("#upload-message");
  const original = page.locator(".file-row", { hasText: "proposal.png" });
  await expect(message).toHaveText("Stored proposal.png locally.", { timeout: 30_000 });
  await expect(original).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator("#file-count")).toHaveText("1");
  const storedSize = await page.locator("#file-size").textContent();

  await original.locator(".preview-file").click();
  const preview = page.locator("#preview-dialog");
  await expect(preview).toBeVisible();
  const originalHash = await preview.locator("#preview-hash").textContent();
  expect(originalHash).toMatch(/^[a-f0-9]{64}$/);
  await preview.locator("#close-preview").click();

  await page.locator("#file-input").setInputFiles({
    name: "invoice-copy.png",
    mimeType: "image/png",
    buffer: imageBytes,
  });
  await expect(message).toHaveClass(/error/, { timeout: 30_000 });
  await expect(message).toHaveText("invoice-copy.png is already in this case.");
  await expect(page.locator(".file-row")).toHaveCount(1);
  await expect(page.locator(".file-row", { hasText: "proposal.png" })).toHaveCount(1);
  await expect(page.locator(".file-row", { hasText: "invoice-copy.png" })).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("1");
  await expect(page.locator("#nav-file-count")).toHaveText("1");
  await expect(page.locator("#file-size")).toHaveText(storedSize || "");

  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible({ timeout: 30_000 });
  const persisted = page.locator(".file-row", { hasText: "proposal.png" });
  await expect(persisted).toHaveCount(1);
  await expect(page.locator(".file-row", { hasText: "invoice-copy.png" })).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("1");
  await persisted.locator(".preview-file").click();
  await expect(page.locator("#preview-hash")).toHaveText(originalHash || "");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
