import { expect, test } from "playwright/test";

test("rejects malformed extraction artifacts before consent or network activity", async ({ page }) => {
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
    const base = {
      adapterId: "pdfjs-text",
      adapterVersion: "1.0.0+validation-test",
      text: "First page",
      pages: [{ pageNumber: 1, text: "First page" }],
      warnings: [],
    };
    const attempt = async (artifact: Record<string, unknown>) => {
      try {
        await requestAnalysis({
          file,
          processingJob: { status: "ready_for_ai", fileId: file.id, fileHash: file.sha256, artifact },
          consentAccepted: true,
          fetchImpl,
        });
        return "accepted";
      } catch (error) {
        return (error as { code?: string }).code || "unknown";
      }
    };
    return {
      duplicatePages: await attempt({ ...base, text: "First page\n\nConflicting duplicate", pages: [
        { pageNumber: 1, text: "First page" },
        { pageNumber: 1, text: "Conflicting duplicate" },
      ] }),
      oversizedText: await attempt({ ...base, text: "x".repeat(200_001), pages: [{ pageNumber: 1, text: "x".repeat(200_001) }] }),
      emptyText: await attempt({ ...base, text: "", pages: [{ pageNumber: 1, text: "   " }] }),
      mismatchedText: await attempt({ ...base, text: "Different text" }),
      invalidAdapter: await attempt({ ...base, adapterId: "" }),
      invalidRanges: await attempt({ ...base, pages: [{ pageNumber: 1, text: "First page", start: 1, end: 11 }] }),
      invalidWarnings: await attempt({ ...base, warnings: [""] }),
      fetchCalls,
    };
  });

  expect(result).toEqual({
    duplicatePages: "invalid_extraction",
    oversizedText: "invalid_extraction",
    emptyText: "invalid_extraction",
    mismatchedText: "invalid_extraction",
    invalidAdapter: "invalid_extraction",
    invalidRanges: "invalid_extraction",
    invalidWarnings: "invalid_extraction",
    fetchCalls: 0,
  });
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
