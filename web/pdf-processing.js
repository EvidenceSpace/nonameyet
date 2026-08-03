import { loadLocalPdfEngine } from "./pdf-engine.js";
import { SCANNED_PDF_BASE_MESSAGE } from "./scanned-pdf-recovery.js";

export async function processPdf(file) {
  const base = { fileId: file.id, caseId: file.caseId, fileHash: file.sha256, updatedAt: new Date().toISOString() };
  try {
    const pdfjs = await loadLocalPdfEngine();
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.original.arrayBuffer()), isEvalSupported: false, useWorkerFetch: false, useSystemFonts: true, stopAtErrors: true });
    const doc = await task.promise;
    if (doc.numPages > 500) throw new Error("This PDF has more than 500 pages.");
    const pages = []; let characters = 0;
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent({ disableNormalization: false, includeMarkedContent: false });
      let text = "";
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        if (text && !text.endsWith("\n") && !/^\s/.test(item.str) && !/\s$/.test(text)) text += " ";
        text += item.str; if (item.hasEOL) text += "\n";
      }
      characters += text.replace(/\s/g, "").length; pages.push({ pageNumber, text }); page.cleanup?.();
    }
    await doc.destroy?.();
    if (characters < 20) return { ...base, status: "needs_ocr", message: SCANNED_PDF_BASE_MESSAGE, pages: [] };
    return { ...base, status: "ready_for_ai", message: `Text ready from ${pages.length} page${pages.length === 1 ? "" : "s"}.`, artifact: { adapterId: "pdfjs-text", adapterVersion: `1.0.0+pdfjs-${pdfjs.version}`, pages, text: pages.map((page) => page.text.trim()).filter(Boolean).join("\n\n") } };
  } catch (error) {
    return { ...base, status: "failed", message: error instanceof Error ? error.message : "PDF processing failed." };
  }
}
