import { expect, test } from "playwright/test";

test("rejects malformed extracted pages before consent or network activity", async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  await page.goto("/");

  const result = await page.evaluate(async () => {
    const { requestAnalysis } = await import("/analysis-client.js");
    const file = { id: "file-validated", sha256: "a".repeat(64), name: "record.pdf" };
    let fetchCalls = 0;
    const fetchImpl = async () => {
      fetchCalls += 1;
      throw new Error("Network must not be reached");
    };
    const attempt = async (pages: Array<{ pageNumber: number; text: string }>) => {
      try {
        await requestAnalysis({
          file,
          processingJob: {
            status: "ready_for_ai",
            fileId: file.id,
            fileHash: file.sha256,
            artifact: { pages },
          },
          consentAccepted: true,
          fetchImpl,
        });
        return "accepted";
      } catch (error) {
        return (error as { code?: string }).code || "unknown";
      }
    };
    return {
      duplicatePages: await attempt([
        { pageNumber: 1, text: "First page" },
        { pageNumber: 1, text: "Conflicting duplicate" },
      ]),
      oversizedText: await attempt([{ pageNumber: 1, text: "x".repeat(200_001) }]),
      emptyText: await attempt([{ pageNumber: 1, text: "" }]),
      fetchCalls,
    };
  });

  expect(result).toEqual({
    duplicatePages: "invalid_extraction",
    oversizedText: "invalid_extraction",
    emptyText: "invalid_extraction",
    fetchCalls: 0,
  });
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
