import assert from "node:assert/strict"
import test from "node:test"
import { inspectPdfStructure } from "../src/report/pdf-inspection.js"

const encode = (value: string) => new TextEncoder().encode(value)

test("PDF inspection counts page objects without counting the page tree", () => {
  const result = inspectPdfStructure(encode("%PDF-1.7\n1 0 obj <</Type /Pages /Count 2>> endobj\n2 0 obj <</Type /Page>> endobj\n3 0 obj <</Type /Page>> endobj\nstartxref\n120\n%%EOF\n"))
  assert.equal(result.hasHeader, true)
  assert.equal(result.hasEofMarker, true)
  assert.equal(result.hasStartXref, true)
  assert.equal(result.pageCount, 2)
})

test("PDF inspection exposes active-content and packaging boundaries", () => {
  const result = inspectPdfStructure(encode("%PDF-1.7\n<</Type /Page /Encrypt 1 /JavaScript 2 /OpenAction 3 /EmbeddedFiles 4>>\nstartxref\n9\n%%EOF"))
  assert.equal(result.hasEncryption, true)
  assert.equal(result.hasJavaScript, true)
  assert.equal(result.hasOpenAction, true)
  assert.equal(result.hasEmbeddedFiles, true)
})

test("truncated or non-PDF bytes fail structural markers", () => {
  const result = inspectPdfStructure(encode("not a complete PDF"))
  assert.equal(result.hasHeader, false)
  assert.equal(result.hasEofMarker, false)
  assert.equal(result.hasStartXref, false)
  assert.equal(result.pageCount, 0)
})
