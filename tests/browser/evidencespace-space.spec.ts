import { expect, test, type Page } from "playwright/test";

async function openSpace(page: Page) {
  await page.goto("/evidencespace-shell.html?route=space&case=C-03");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".es-wb-item").first()).toBeVisible();
}

const counts = (page: Page) => page.evaluate(() => ({
  items: document.querySelectorAll(".es-wb-item").length,
  links: document.querySelectorAll("[data-link-id]").length,
  strokes: document.querySelectorAll("[data-stroke-id]").length,
}));

test("opens a case map board with sources, links, and the whiteboard tools", async ({ page }) => {
  await openSpace(page);
  await expect(page.getByRole("heading", { level: 1, name: "Case map" })).toBeVisible();
  await expect(page.getByRole("toolbar", { name: "Whiteboard tools" }).getByRole("button")).toHaveCount(10);
  await expect(page.locator('.es-wb-item[data-type="evidence"]')).toHaveCount(6);
  expect((await counts(page)).links).toBeGreaterThanOrEqual(4);
  await expect(page.locator("[data-save-status]")).toHaveText("Saved in this browser");
});

test("adds, writes, draws, connects, undoes, and keeps the board after reload", async ({ page }) => {
  await openSpace(page);
  const start = await counts(page);
  const viewport = page.locator(".es-wb-viewport");
  const box = (await viewport.boundingBox())!;

  await page.mouse.dblclick(box.x + box.width * 0.45, box.y + box.height - 110);
  await page.keyboard.type("Ask for the change log");
  await page.keyboard.press("Escape");
  const note = page.locator('.es-wb-item[data-type="note"]', { hasText: "Ask for the change log" });
  await expect(note).toBeVisible();

  await page.keyboard.press("p");
  await page.mouse.move(box.x + 300, box.y + box.height - 60);
  await page.mouse.down();
  for (let step = 1; step <= 10; step += 1) await page.mouse.move(box.x + 300 + step * 12, box.y + box.height - 60 - step * 3);
  await page.mouse.up();
  expect((await counts(page)).strokes).toBe(start.strokes + 1);
  await page.keyboard.press("Control+z");
  expect((await counts(page)).strokes).toBe(start.strokes);
  await page.keyboard.press("Control+Shift+z");
  expect((await counts(page)).strokes).toBe(start.strokes + 1);

  await page.keyboard.press("v");
  await note.hover();
  const port = (await note.locator('[data-port="n"]').boundingBox())!;
  const question = (await page.locator('.es-wb-item[data-type="question"]').first().boundingBox())!;
  await page.mouse.move(port.x + port.width / 2, port.y + port.height / 2);
  await page.mouse.down();
  await page.mouse.move(question.x + question.width / 2, question.y + question.height / 2, { steps: 8 });
  await page.mouse.up();
  expect((await counts(page)).links).toBe(start.links + 1);
  const relationship = page.getByRole("group", { name: "Relationship" });
  await relationship.getByRole("button", { name: "Open question" }).click();
  await expect(relationship.getByRole("button", { name: "Open question" })).toHaveAttribute("aria-pressed", "true");

  await expect(page.locator("[data-save-status]")).toHaveText("Saved in this browser");
  await page.reload();
  await expect(page.locator('.es-wb-item[data-type="note"]', { hasText: "Ask for the change log" })).toBeVisible();
  expect(await counts(page)).toEqual({ items: start.items + 1, links: start.links + 1, strokes: start.strokes + 1 });
});

test("brings case items in, reviews suggested links, and creates boards from templates", async ({ page }) => {
  await openSpace(page);
  const start = await counts(page);
  await page.getByRole("button", { name: "Add from case" }).click();
  const drawer = page.getByRole("complementary", { name: "Add from case" });
  await drawer.getByRole("tab", { name: "People" }).click();
  await drawer.getByRole("button", { name: "Add Alex Morgan" }).click();
  await expect(drawer.getByRole("button", { name: "Show Alex Morgan on the board" })).toBeVisible();
  await drawer.getByRole("tab", { name: "Questions" }).click();
  await drawer.getByPlaceholder("Write a new question").fill("Did Mia reject the delivery in writing?");
  await drawer.getByPlaceholder("Write a new question").press("Enter");
  await expect(page.locator('.es-wb-item[data-type="question"]', { hasText: "Did Mia reject" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  await page.getByRole("button", { name: /Suggest links/ }).click();
  await expect(page.locator(".es-wb-suggestion")).toHaveCount(2);
  await page.getByRole("button", { name: "Add suggested link" }).first().click();
  await expect(page.locator(".es-wb-suggestion")).toHaveCount(1);
  await page.getByRole("button", { name: "Dismiss suggestion" }).click();
  await expect(page.locator(".es-wb-suggestion")).toHaveCount(0);
  expect((await counts(page)).links).toBe(start.links + 1);

  await page.getByRole("button", { name: "Boards" }).click();
  await page.getByRole("menuitem", { name: "New board…" }).click();
  const dialog = page.getByRole("dialog", { name: "New board" });
  await dialog.getByLabel("Board name").fill("Key dates");
  await dialog.locator("label", { hasText: "Timeline" }).click();
  await dialog.getByRole("button", { name: "Create board" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Key dates" })).toBeVisible();
  await expect(page.locator('.es-wb-item[data-type="date"]')).toHaveCount(5);

  await page.getByRole("button", { name: "Boards" }).click();
  await page.getByRole("menuitemradio", { name: /Case map/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Case map" })).toBeVisible();
  await expect(page.locator('.es-wb-item[data-type="question"]', { hasText: "Did Mia reject" })).toBeVisible();
});

test("selects with the keyboard, deletes, restores, and opens source details", async ({ page }) => {
  await openSpace(page);
  const start = await counts(page);
  await page.locator(".es-wb-viewport").focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Delete");
  await expect(page.getByText("This board is empty")).toBeVisible();
  await page.keyboard.press("Control+z");
  expect(await counts(page)).toEqual(start);

  const email = page.locator('.es-wb-item[data-type="evidence"]', { hasText: "2-August-email.eml" });
  await email.focus();
  const selection = page.getByRole("toolbar", { name: "Selection" });
  await expect(selection).toBeVisible();
  await selection.getByRole("link", { name: "Details" }).click();
  await expect(page.locator("#context-lens")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#context-lens")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Case map" })).toBeVisible();
});

test("zooms with the controls and starts legibly on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSpace(page);
  const label = page.locator("[data-zoom-label]");
  await expect(label).toHaveText("60%");
  await page.getByRole("button", { name: "Fit everything" }).click();
  await expect(label).not.toHaveText("60%");
  await page.getByRole("button", { name: "Reset zoom to 100%" }).click();
  await expect(label).toHaveText("100%");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});