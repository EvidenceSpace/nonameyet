import { expect, test } from "playwright/test";

test("case library supports skip navigation and named dynamic results", async ({ page }) => {
  await page.goto("/cases.html");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.getByRole("region", { name: "Local cases" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "CaseFind home" })).toHaveCount(1);
});

test("workspace missing-case recovery keeps navigation and dialogs named", async ({ page }) => {
  await page.goto("/case.html?id=missing-accessibility-case");
  const error = page.locator("#workspace-error");
  await expect(error).toBeVisible();
  await expect(error).toHaveAttribute("data-state", "missing");
  await expect(error.locator('[role="status"]')).toHaveCount(1);
  await expect(page.locator(".skip-link")).toHaveAttribute("href", "#workspace-error");
  await expect(page.locator('nav[aria-label="Case sections"]')).toHaveCount(1);
  await expect(page.locator('#delete-dialog[aria-labelledby="delete-dialog-title"]')).toHaveCount(1);
  await expect(page.locator('#preview-dialog[aria-labelledby="preview-title"]')).toHaveCount(1);
  await expect(page.locator('#fact-dialog[aria-labelledby="fact-dialog-title"]')).toHaveCount(1);
  await expect(page.locator('#correction-dialog[aria-labelledby="correction-dialog-title"]')).toHaveCount(1);
  await expect(page.locator('#close-fact[aria-label="Close add fact dialog"]')).toHaveCount(1);
  await expect(page.locator('#close-correction[aria-label="Close correction dialog"]')).toHaveCount(1);
});
