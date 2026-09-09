import { expect, test, type Page } from "playwright/test";

async function openShell(page: Page, search = "?route=home") {
  await page.goto(`/evidencespace-shell.html${search}`);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    documentClient: document.documentElement.clientWidth,
    documentScroll: document.documentElement.scrollWidth,
    mainClient: document.querySelector("#main-content")!.clientWidth,
    mainScroll: document.querySelector("#main-content")!.scrollWidth,
  }));
  expect(dimensions.documentScroll).toBeLessThanOrEqual(dimensions.documentClient);
  expect(dimensions.mainScroll).toBeLessThanOrEqual(dimensions.mainClient);
}

test("uses the approved large-window shell geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openShell(page);

  const rail = await page.locator(".es-global-rail").boundingBox();
  const topbar = await page.locator(".es-topbar").boundingBox();
  const main = await page.locator(".es-main-frame").boundingBox();
  expect(rail).not.toBeNull();
  expect(topbar).not.toBeNull();
  expect(main).not.toBeNull();
  expect({ x: Math.round(rail!.x), y: Math.round(rail!.y), width: Math.round(rail!.width) }).toEqual({ x: 22, y: 22, width: 68 });
  expect(Math.round(900 - rail!.y - rail!.height)).toBe(22);
  expect({ x: Math.round(topbar!.x), y: Math.round(topbar!.y), height: Math.round(topbar!.height) }).toEqual({ x: 108, y: 22, height: 68 });
  expect(Math.round(1440 - topbar!.x - topbar!.width)).toBe(22);
  expect({ x: Math.round(main!.x), y: Math.round(main!.y) }).toEqual({ x: 108, y: 106 });
  expect(Math.round(1440 - main!.x - main!.width)).toBe(22);
  expect(Math.round(900 - main!.y - main!.height)).toBe(22);
});

test("has one main heading, one active destination, and a working skip link", async ({ page }) => {
  await openShell(page);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Good afternoon, Alex.");
  await expect(page.locator('.es-global-nav [aria-current="page"]')).toHaveCount(1);
  await expect(page.locator('[data-global-route="home"]')).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  for (const name of ["Home", "Cases", "New case", "Lawyers", "Security and help", "Settings", "Account"]) {
    await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Notifications, 3 unread" })).toBeVisible();
});

test("navigates Home to Cases to Brief to E-04 without reloading the shell", async ({ page }) => {
  await openShell(page);
  const bootId = await page.evaluate(() => (window as typeof window & { __evidenceSpaceBootId: string }).__evidenceSpaceBootId);

  await page.locator("#topbar-nav").getByRole("link", { name: "Cases", exact: true }).click();
  await expect(page.locator("#page-title")).toHaveText("Cases");
  await expect(page.locator("#page-title")).toBeFocused();
  expect(await page.evaluate(() => (window as typeof window & { __evidenceSpaceBootId: string }).__evidenceSpaceBootId)).toBe(bootId);

  await page.locator("[data-case-row]").first().getByRole("link", { name: "Harbor Studio payment dispute" }).click();
  await expect(page.locator("#page-title")).toHaveText("Current situation");
  const labels = await page.locator("#topbar-nav a").allTextContents();
  expect(labels).toEqual(["Brief", "Space", "Evidence", "Research", "Work", "Room", "Reports"]);
  for (const href of await page.locator("#topbar-nav a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toContain("case=C-03");
  }

  await page.locator(".es-next-step-card").getByRole("link", { name: "Review source" }).click();
  await expect(page.locator("#page-title")).toHaveText("Evidence");
  await expect(page).toHaveURL(/route=evidence&case=C-03&evidence=E-04&from=brief/);
  await expect(page.getByRole("heading", { name: "2-August-email.eml" })).toBeVisible();
  await expect(page.locator(".es-source-item[aria-current=true]")).toHaveAttribute("data-tone", "contrary");
  expect(await page.evaluate(() => (window as typeof window & { __evidenceSpaceBootId: string }).__evidenceSpaceBootId)).toBe(bootId);
});

test("keeps exact-object return and browser history continuity", async ({ page }) => {
  await openShell(page, "?route=evidence&case=C-03&evidence=E-04&from=brief");
  await page.getByRole("link", { name: "Back to Brief" }).click();
  await expect(page.locator("#page-title")).toHaveText("Current situation");
  await page.goBack();
  await expect(page.locator("#page-title")).toHaveText("Evidence");
  await expect(page).toHaveURL(/evidence=E-04/);
  await page.goForward();
  await expect(page.locator("#page-title")).toHaveText("Current situation");
});

test("filters and searches the case library without replacing the page", async ({ page }) => {
  await openShell(page, "?route=cases");
  await page.getByRole("button", { name: /Needs you/ }).click();
  await expect(page.locator("[data-case-row]:visible")).toHaveCount(1);
  await expect(page.locator("#case-result-count")).toHaveText("1 shown");
  await page.getByRole("button", { name: /All cases/ }).click();
  await page.locator("#case-search").fill("Northbridge");
  await expect(page.locator("[data-case-row]:visible")).toHaveCount(1);
  await expect(page.locator("[data-case-row]:visible")).toContainText("Northbridge deposit recovery");
});

test("opens the shared Context Lens, supports tabs, and closes with Escape", async ({ page }) => {
  await openShell(page, "?route=brief&case=C-03");
  await page.locator(".es-summary-map .es-map-node.is-contrary").click();
  await expect(page.locator("#context-lens")).toBeVisible();
  await expect(page).toHaveURL(/context=E-04/);
  await expect(page.locator("[data-context-close]")).toBeFocused();
  await page.getByRole("tab", { name: "Details" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Comments" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#context-panel-comments")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#context-lens")).toBeHidden();
  await expect(page).not.toHaveURL(/context=/);
});

test("fails closed for denied and invalid addresses", async ({ page }) => {
  await openShell(page, "?route=brief&case=C-03&view=denied");
  await expect(page.locator("#page-title")).toHaveText("You don’t have access");
  await expect(page.locator("#topbar-title")).toHaveText("Restricted case");
  await expect(page.locator("body")).not.toContainText("Harbor Studio payment dispute");

  await openShell(page, "?route=javascript%3Aalert(1)&case=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
  await expect(page.locator("#page-title")).toHaveText("Page not found");
  await expect(page.locator("img")).toHaveCount(0);
  await expect(page.locator('.es-global-nav [aria-current]')).toHaveCount(0);
});

test("renders honest empty and recovery states", async ({ page }) => {
  await openShell(page, "?route=cases&view=empty");
  await expect(page.locator("#page-title")).toHaveText("No cases yet");
  await expect(page.getByRole("link", { name: "Start a case" })).toBeVisible();
  await openShell(page, "?route=evidence&case=C-03&view=error");
  await expect(page.locator("#page-title")).toHaveText("Evidence couldn’t load");
  await expect(page.getByText("Nothing changed. Try again when you’re ready.")).toBeVisible();
});

test("reflows Evidence and Context Lens without page-level overflow", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 900 });
  await openShell(page, "?route=evidence&case=C-03&evidence=E-04&from=brief");
  await expectNoPageOverflow(page);
  const rail = await page.locator(".es-global-rail").boundingBox();
  const main = await page.locator(".es-main-frame").boundingBox();
  expect(Math.round(900 - rail!.y - rail!.height)).toBe(8);
  expect(Math.round(main!.x)).toBe(8);
  expect(Math.round(520 - main!.x - main!.width)).toBe(8);

  await page.getByRole("link", { name: "Open Context Lens" }).click();
  await expect(page.locator("#context-lens")).toBeVisible();
  await page.waitForTimeout(20);
  await expectNoPageOverflow(page);
  const panel = await page.locator("#context-lens").boundingBox();
  expect(panel!.x).toBeGreaterThanOrEqual(0);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(520);
});

test("honors system dark mode and reduced motion", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await openShell(page);
  const tokens = await page.locator("html").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      text: style.getPropertyValue("--es-color-text").trim(),
      duration: style.getPropertyValue("--es-duration-fast").trim(),
      scrollBehavior: style.scrollBehavior,
    };
  });
  expect(tokens.text).toBe("#f2f4f7");
  expect(tokens.duration).toBe("1ms");
  expect(tokens.scrollBehavior).toBe("auto");
});
