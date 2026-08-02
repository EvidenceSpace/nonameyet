import { expect, test } from "playwright/test";

const maximumBytes = 20 * 1024 * 1024;

test("rejects an oversized record before hashing or persistence", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Oversized record boundary");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that oversized originals are rejected atomically.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await expect(page.locator("#workspace")).toBeVisible();

  await page.locator("#file-input").evaluate((input, byteLength) => {
    const transfer = new DataTransfer();
    const oversized = new File(
      [new Uint8Array(Number(byteLength))],
      "oversized.png",
      { type: "image/png" },
    );
    transfer.items.add(oversized);
    Object.defineProperty(input, "files", { value: transfer.files, configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, maximumBytes + 1);

  const message = page.locator("#upload-message");
  await expect(message).toHaveClass(/error/);
  await expect(message).toHaveText("oversized.png exceeds 20 MB.");
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator(".empty-files")).toContainText("No records added yet");
  await expect(page.locator("#file-count")).toHaveText("0");
  await expect(page.locator("#nav-file-count")).toHaveText("0");
  await expect(page.locator("#file-size")).toHaveText("0 bytes");

  await page.reload();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator(".file-row")).toHaveCount(0);
  await expect(page.locator("#file-count")).toHaveText("0");
  await expect(page.locator("#file-size")).toHaveText("0 bytes");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
