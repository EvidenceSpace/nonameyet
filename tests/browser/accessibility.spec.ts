import { expect, test } from "playwright/test";

for (const route of ["/index.html", "/cases-new.html"]) {
  test(`${route} exposes keyboard navigation and a main landmark`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1:visible")).toHaveCount(1);

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    expect(await skipLink.evaluate((element) => getComputedStyle(element).outlineWidth)).not.toBe("0px");
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
}

test("intake controls have programmatic accessible names", async ({ page }) => {
  await page.goto("/cases-new.html");
  const unnamed = await page.locator('a[href],button,input:not([type="hidden"]),textarea,select').evaluateAll((elements) =>
    elements.flatMap((element) => {
      const ariaLabel = element.getAttribute("aria-label")?.trim();
      const labelledBy = element.getAttribute("aria-labelledby")?.trim();
      const text = element.textContent?.trim();
      const labels = "labels" in element ? Array.from((element as HTMLInputElement).labels ?? []) : [];
      const hasName = Boolean(ariaLabel || labelledBy || text || labels.some((label) => label.textContent?.trim()));
      return hasName ? [] : [`${element.tagName.toLowerCase()}#${element.id}`];
    }),
  );
  expect(unnamed).toEqual([]);
});

test("reduced-motion preference disables smooth scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/index.html");
  const scrollBehavior = await page.locator("html").evaluate((element) => getComputedStyle(element).scrollBehavior);
  expect(scrollBehavior).toBe("auto");
});
