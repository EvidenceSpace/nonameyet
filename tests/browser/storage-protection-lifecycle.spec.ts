import { expect, test } from "playwright/test";

test("reports estimated pressure and requests persistent storage only on user action", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  await page.addInitScript(() => {
    let persisted = false;
    let persistCalls = 0;
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: async () => ({ usage: 85, quota: 100 }),
        persisted: async () => persisted,
        persist: async () => { persistCalls += 1; persisted = true; return true; },
      },
    });
    Object.defineProperty(globalThis, "__storagePersistCalls", { get: () => persistCalls });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases.html");
  const panel = page.locator(".storage-health");
  await expect(panel).toHaveAttribute("data-state", "pressure");
  await expect(panel).toContainText("Storage use is high");
  await expect(panel).toContainText("85 bytes used of 100 bytes estimated quota");
  await expect(panel).toContainText("15 bytes of the reported origin quota remains");
  await expect(panel.locator(".storage-meter")).toHaveAttribute("aria-valuenow", "85");
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __storagePersistCalls: number }).__storagePersistCalls)).toBe(0);

  await panel.locator(".storage-protect").click();
  await expect(panel).toHaveAttribute("data-state", "protected");
  await expect(panel).toContainText("Protected from automatic cleanup");
  await expect(panel).toContainText("Manual clearing and device loss can still remove local cases");
  await expect(panel.locator(".storage-protect")).toHaveCount(0);
  expect(await page.evaluate(() => (globalThis as typeof globalThis & { __storagePersistCalls: number }).__storagePersistCalls)).toBe(1);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
