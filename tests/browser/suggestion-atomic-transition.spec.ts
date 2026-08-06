import { expect, test } from "playwright/test";

const imageBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const staleFailureMessage = "This suggestion changed in another tab. Nothing was confirmed. Reload and review the latest version.";

test("confirmation and correction commit exact review decisions once", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Exact atomic review decisions");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying exact-current suggestion confirmation and correction.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "invoice.png", mimeType: "image/png", buffer: imageBytes });

  const before = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    const base = {
      caseId, fileId: file.id, label: "Invoice total", confidence: 0.91,
      status: "suggested", aiSuggested: true, decidedByUser: false,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "quote", quote: "Invoice total ₹5,000" } },
      createdAt: "2026-08-03T00:00:00.000Z",
    };
    await storage.saveSuggestion({ ...base, id: "suggestion_atomic_success_confirm", value: "₹5,000" });
    await storage.saveSuggestion({ ...base, id: "suggestion_atomic_success_correct", value: "₹5,250" });
    return { updatedAt: (await storage.getCase(caseId)).updatedAt, fileHash: file.sha256 };
  });
  await page.reload();

  const confirmation = page.locator('.suggestion-card[data-id="suggestion_atomic_success_confirm"]');
  await expect(confirmation).toHaveCount(1);
  const confirmationNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await confirmation.locator(".confirm-suggestion").evaluate((button: HTMLButtonElement) => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await confirmationNavigation;
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator('.suggestion-card[data-id="suggestion_atomic_success_confirm"]')).toHaveCount(0);
  await expect(page.locator(".fact-record")).toHaveCount(1);

  const correction = page.locator('.suggestion-card[data-id="suggestion_atomic_success_correct"]');
  await expect(correction).toHaveCount(1);
  await correction.locator(".correct-suggestion").click();
  await expect(page.locator("#correction-dialog")).toBeVisible();
  await page.locator("#correction-value").fill("₹4,750");
  const correctionNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await page.locator("#correction-form").evaluate((form: HTMLFormElement) => form.requestSubmit());
  await correctionNavigation;
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator(".fact-record")).toHaveCount(2);
  await expect(page.locator("#nav-review-count")).toHaveText("0");
  await expect(page.locator("#nav-fact-count")).toHaveText("2");

  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      facts: await storage.getFactsForCase(caseId),
      suggestions: await storage.getSuggestionsForCase(caseId),
      updatedAt: (await storage.getCase(caseId)).updatedAt,
    };
  });
  expect(stored.suggestions).toEqual([]);
  expect(stored.facts.map((fact: { status: string; value: string }) => [fact.status, fact.value]).sort()).toEqual([
    ["confirmed", "₹5,000"],
    ["corrected", "₹4,750"],
  ]);
  expect(stored.facts.every((fact: { sourceReference: { sha256: string } }) => fact.sourceReference.sha256 === before.fileHash)).toBe(true);
  expect(stored.updatedAt).not.toBe(before.updatedAt);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("a stale rendered card cannot confirm a changed suggestion", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Stale review protection");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that a changed suggestion cannot be accepted from stale UI.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "invoice.png", mimeType: "image/png", buffer: imageBytes });

  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    await storage.saveSuggestion({
      id: "suggestion_stale_render", caseId, fileId: file.id, label: "Invoice total",
      value: "₹5,000", confidence: 0.91, status: "suggested", aiSuggested: true,
      decidedByUser: false,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "quote", quote: "Invoice total ₹5,000" } },
      createdAt: "2026-08-03T00:00:00.000Z",
    });
  });
  await page.reload();

  const card = page.locator('.suggestion-card[data-id="suggestion_stale_render"]');
  const confirmButton = card.locator(".confirm-suggestion");
  await expect(card.locator(".suggestion-value")).toHaveText("₹5,000");
  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [current] = await storage.getSuggestionsForCase(caseId);
    await storage.saveSuggestion({ ...current, value: "₹6,000", updatedAt: "2026-08-06T06:05:00.000Z" });
  });

  await confirmButton.click();
  await expect(page.locator("#review-decision-status")).toBeVisible();
  await expect(page.locator("#review-decision-status")).toHaveText(staleFailureMessage);
  await expect(card.locator(".suggestion-value")).toHaveText("₹5,000");
  await expect(card).not.toHaveAttribute("aria-busy", "true");
  await expect(confirmButton).toBeEnabled();

  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      facts: await storage.getFactsForCase(caseId),
      suggestions: await storage.getSuggestionsForCase(caseId),
    };
  });
  expect(stored.facts).toEqual([]);
  expect(stored.suggestions.map((item: { id: string; value: string }) => [item.id, item.value])).toEqual([
    ["suggestion_stale_render", "₹6,000"],
  ]);

  await page.reload();
  await expect(page.locator('.suggestion-card[data-id="suggestion_stale_render"] .suggestion-value')).toHaveText("₹6,000");
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("stale rendered cards cannot mark changed suggestions not-sure or dismissed", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });

  await page.goto("/cases-new.html");
  await page.locator("#case-title").fill("Stale non-acceptance protection");
  await page.locator("#client").fill("Example client");
  await page.locator("#amount").fill("5000");
  await page.locator("#summary").fill("A synthetic case verifying that changed suggestions cannot be marked aside or dismissed from stale UI.");
  await page.locator("#continue-button").click();
  await page.locator("#continue-button").click();
  await page.locator("#local-storage-ack").check();
  await page.locator("#continue-button").click();
  await page.locator("#open-workspace").click();
  await page.locator("#file-input").setInputFiles({ name: "invoice.png", mimeType: "image/png", buffer: imageBytes });

  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const [file] = await storage.getFilesForCase(caseId);
    const base = {
      caseId, fileId: file.id, label: "Invoice total", confidence: 0.7,
      status: "suggested", aiSuggested: true, decidedByUser: false,
      sourceReference: { fileId: file.id, sha256: file.sha256, locator: { kind: "quote", quote: "Invoice details" } },
      createdAt: "2026-08-03T00:00:00.000Z",
    };
    await storage.saveSuggestion({ ...base, id: "suggestion_stale_uncertain", value: "₹5,200" });
    await storage.saveSuggestion({ ...base, id: "suggestion_stale_dismiss", value: "₹5,400" });
  });
  await page.reload();

  const uncertainCard = page.locator('.suggestion-card[data-id="suggestion_stale_uncertain"]');
  const dismissCard = page.locator('.suggestion-card[data-id="suggestion_stale_dismiss"]');
  await expect(uncertainCard.locator(".suggestion-value")).toHaveText("₹5,200");
  await expect(dismissCard.locator(".suggestion-value")).toHaveText("₹5,400");

  await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    const suggestions = await storage.getSuggestionsForCase(caseId);
    for (const suggestion of suggestions) {
      const value = suggestion.id === "suggestion_stale_uncertain" ? "₹6,200" : "₹6,400";
      await storage.saveSuggestion({ ...suggestion, value, updatedAt: "2026-08-06T06:06:00.000Z" });
    }
  });

  const uncertainButton = uncertainCard.locator(".uncertain-suggestion");
  await uncertainButton.click();
  await expect(page.locator("#review-decision-status")).toHaveText(staleFailureMessage);
  await expect(uncertainButton).toBeEnabled();
  await expect(uncertainCard).not.toHaveAttribute("aria-busy", "true");

  const dismissButton = dismissCard.locator(".dismiss-suggestion");
  await dismissButton.click();
  await expect(page.locator("#review-decision-status")).toHaveText(staleFailureMessage);
  await expect(dismissButton).toBeEnabled();
  await expect(dismissCard).not.toHaveAttribute("aria-busy", "true");

  const stored = await page.evaluate(async () => {
    const caseId = new URLSearchParams(location.search).get("id") as string;
    const storage = await import("/storage.js");
    return {
      facts: await storage.getFactsForCase(caseId),
      suggestions: await storage.getSuggestionsForCase(caseId),
    };
  });
  expect(stored.facts).toEqual([]);
  expect(stored.suggestions.map((item: { id: string; status: string; value: string }) => [item.id, item.status, item.value]).sort()).toEqual([
    ["suggestion_stale_dismiss", "suggested", "₹6,400"],
    ["suggestion_stale_uncertain", "suggested", "₹6,200"],
  ]);

  await page.reload();
  await expect(page.locator('.suggestion-card[data-id="suggestion_stale_uncertain"] .suggestion-value')).toHaveText("₹6,200");
  await expect(page.locator('.suggestion-card[data-id="suggestion_stale_dismiss"] .suggestion-value')).toHaveText("₹6,400");
  await expect(page.locator(".fact-record")).toHaveCount(0);
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
