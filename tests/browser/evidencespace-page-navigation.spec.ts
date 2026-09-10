import { expect, test, type Page } from "playwright/test";

async function openShell(page: Page, search = "?route=home") {
  await page.goto(`/evidencespace-shell.html${search}`);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
}

test("labels the main landmark with the current page heading", async ({ page }) => {
  await openShell(page, "?route=cases");
  await expect(page.locator("main")).toHaveAttribute("aria-labelledby", "page-title");
  await expect(page.locator("#page-title")).toHaveText("Cases");

  await page.locator("[data-case-row]").first().getByRole("link", { name: "Harbor Studio payment dispute" }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-labelledby", "page-title");
  await expect(page.locator("#page-title")).toHaveText("Current situation");
});

test("returns focus to the exact Brief object after the Context Lens closes", async ({ page }) => {
  await openShell(page, "?route=brief&case=C-03");
  const origin = page.locator(".es-summary-map .es-map-node.is-contrary");
  await origin.click();
  await expect(page.locator("[data-context-close]")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.locator("#context-lens")).toBeHidden();
  await expect(origin).toBeFocused();
});

test("returns focus to the exact Evidence control when duplicate context links exist", async ({ page }) => {
  await openShell(page, "?route=evidence&case=C-03&evidence=E-04&from=brief");
  const origin = page.getByRole("link", { name: "Open Context Lens", exact: true });
  await origin.click();
  await expect(page.locator("[data-context-close]")).toBeFocused();

  await page.locator("#context-scrim").click({ position: { x: 4, y: 4 } });
  await expect(page.locator("#context-lens")).toBeHidden();
  await expect(origin).toBeFocused();
});
