import { expect, test } from "playwright/test";

test("keeps the compact Home case map inside its frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/evidencespace-shell.html?route=home");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");

  const layout = await page.locator(".es-resume-map .es-case-map").evaluate((element) => {
    const mapBounds = element.getBoundingClientRect();
    const escapedNodes = [...element.querySelectorAll(".es-map-node")]
      .filter((node) => {
        const bounds = node.getBoundingClientRect();
        return (
          bounds.left < mapBounds.left ||
          bounds.right > mapBounds.right ||
          bounds.top < mapBounds.top ||
          bounds.bottom > mapBounds.bottom
        );
      })
      .map((node) => node.textContent?.trim().replace(/\s+/g, " "));

    return {
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      escapedNodes,
    };
  });

  expect(layout.scrollHeight).toBe(layout.clientHeight);
  expect(layout.escapedNodes).toEqual([]);
});
