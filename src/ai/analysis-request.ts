export interface AnalysisPage { pageNumber: number; text: string; }
export interface AnalysisRequest { fileId: string; fileHash: string; fileName: string; pages: AnalysisPage[]; }
export function parseAnalysisRequest(value: unknown): AnalysisRequest | undefined {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Partial<AnalysisRequest>;
  if (typeof input.fileId !== "string" || !input.fileId.trim()) return undefined;
  if (typeof input.fileHash !== "string" || !/^[a-f0-9]{64}$/i.test(input.fileHash)) return undefined;
  if (typeof input.fileName !== "string" || !input.fileName.trim() || input.fileName.length > 240) return undefined;
  if (!Array.isArray(input.pages) || input.pages.length < 1 || input.pages.length > 500) return undefined;
  let total = 0;
  for (const page of input.pages) {
    if (!page || !Number.isInteger(page.pageNumber) || page.pageNumber < 1 || typeof page.text !== "string") return undefined;
    total += page.text.length; if (total > 200_000) return undefined;
  }
  return { fileId: input.fileId, fileHash: input.fileHash, fileName: input.fileName, pages: input.pages };
}
export function joinPagesForAnalysis(pages: readonly AnalysisPage[]): string { return pages.map((page) => `[PDF page ${page.pageNumber}]\n${page.text}`).join("\n\n"); }
