import { expect, test } from "playwright/test";

test("keeps the ordinary first-use empty state", async ({ page }) => {
  await page.goto("/cases.html");
  const empty = page.locator("#library-empty");
  await expect(empty).toBeVisible();
  await expect(empty).toHaveAttribute("data-state", "first-use");
  await expect(empty).toContainText("No local cases yet");
  await expect(empty).not.toContainText("previously recorded");
});

test("explains an empty library when local case history exists", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("casefind.local-case-history.v1", JSON.stringify({ version: 1, firstStoredAt: "2026-08-01T10:00:00.000Z", lastStoredAt: "2026-08-02T10:00:00.000Z" })));
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => { const url = new URL(request.url()); if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url()); });
  await page.goto("/cases.html");
  const empty = page.locator("#library-empty");
  await expect(empty).toBeVisible();
  await expect(empty).toHaveAttribute("data-state", "history");
  await expect(empty).toContainText("No local cases are available");
  await expect(empty).toContainText("previously recorded at least one successfully stored case");
  await expect(empty).toContainText("CaseFind cannot determine which happened or recover them automatically");
  await expect(empty.getByRole("link", { name: "Restore encrypted backup" })).toHaveAttribute("href", "cases-new.html#restore");
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
