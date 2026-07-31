export type PdfStructureInspection = {
  byteLength: number
  hasHeader: boolean
  hasEofMarker: boolean
  hasStartXref: boolean
  pageCount: number
  hasEncryption: boolean
  hasJavaScript: boolean
  hasOpenAction: boolean
  hasEmbeddedFiles: boolean
}

const decoder = new TextDecoder("latin1")

export function inspectPdfStructure(input: Uint8Array): PdfStructureInspection {
  const text = decoder.decode(input)
  return {
    byteLength: input.byteLength,
    hasHeader: /^%PDF-\d\.\d/.test(text.slice(0, 16)),
    hasEofMarker: /%%EOF\s*$/.test(text),
    hasStartXref: /startxref\s+\d+\s+%%EOF\s*$/.test(text),
    pageCount: text.match(/\/Type\s*\/Page\b/g)?.length ?? 0,
    hasEncryption: /\/Encrypt\b/.test(text),
    hasJavaScript: /\/(?:JavaScript|JS)\b/.test(text),
    hasOpenAction: /\/OpenAction\b/.test(text),
    hasEmbeddedFiles: /\/EmbeddedFiles\b/.test(text),
  }
}
