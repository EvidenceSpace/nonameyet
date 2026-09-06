import { expect, test } from "playwright/test";

async function openShell(page: Parameters<typeof test>[0] extends never ? never : any, route = "home") {
  await page.goto(`/evidencespace-shell.html?route=${route}`);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
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

test("exposes one active global destination and a working skip link", async ({ page }) => {
  await openShell(page);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("Your workspace");
  await expect(page.locator('.es-global-nav [aria-current="page"]')).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  for (const name of ["Home", "Cases", "New case", "Lawyers", "Security and help", "Settings", "Account"]) {
    await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Notifications, 3 unread" }).first()).toBeVisible();
  const homeBox = await page.getByRole("link", { name: "Home", exact: true }).boundingBox();
  expect(homeBox!.height).toBeGreaterThanOrEqual(44);
});

test("keeps the seven case lenses ordered and bound to the same case", async ({ page }) => {
  await page.goto("/evidencespace-shell.html?route=evidence&case=C-03");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#case-context")).toBeVisible();
  await expect(page.locator("#case-id")).toHaveText("C-03");
  await expect(page.locator("#page-title")).toHaveText("Evidence");
  await expect(page.getByRole("link", { name: "Cases", exact: true })).toHaveAttribute("aria-current", "location");

  const labels = await page.locator(".es-case-lens-link").allTextContents();
  expect(labels).toEqual(["Brief", "Space", "Evidence", "Research", "Work", "Room", "Reports"]);
  await expect(page.getByRole("link", { name: "Evidence", exact: true })).toHaveAttribute("aria-current", "page");

  for (const href of await page.locator(".es-case-lens-link").evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    expect(href).toContain("case=C-03");
  }
});

test("rejects unrecognized route and case parameters without rendering them", async ({ page }) => {
  await page.goto("/evidencespace-shell.html?route=javascript%3Aalert(1)&case=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#page-title")).toHaveText("Page not found");
  await expect(page.locator("#case-context")).toBeHidden();
  await expect(page.locator("img")).toHaveCount(0);
  await expect(page.locator('.es-global-nav [aria-current]')).toHaveCount(0);
});

test("reflows into a narrow shell without page-level horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 520, height: 740 });
  await page.goto("/evidencespace-shell.html?route=space&case=C-03");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  const rail = await page.locator(".es-global-rail").boundingBox();
  const main = await page.locator(".es-main-frame").boundingBox();
  expect(Math.round(740 - rail!.y - rail!.height)).toBe(8);
  expect(Math.round(main!.x)).toBe(8);
  expect(Math.round(520 - main!.x - main!.width)).toBe(8);
  await expect(page.getByRole("link", { name: "Return to cases" })).toBeVisible();
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
