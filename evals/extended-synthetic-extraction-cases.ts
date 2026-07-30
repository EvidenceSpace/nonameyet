import type { ExtractionEvaluationFixture } from "../src/ai/evaluation.js";

/**
 * Synthetic edge cases that broaden format and semantic coverage without
 * implying measured provider quality or using customer records.
 */
export const EXTENDED_SYNTHETIC_EXTRACTION_CASES: ExtractionEvaluationFixture[] = [
  {
    id: "partial-payment-balance",
    fileName: "partial-payment.txt",
    documentType: "payment_record",
    text: "Invoice total: USD 1,200.00\nPayment received: USD 500.00 on July 18, 2026\nOutstanding balance: USD 700.00",
    expected: [
      { kind: "fact", label: "Invoice total", value: "USD 1,200.00", confidence: 1, locator: { kind: "whole_file", quote: "Invoice total: USD 1,200.00" } },
      { kind: "event", label: "Partial payment", value: "USD 500.00 received", occurredAt: "2026-07-18", confidence: 1, locator: { kind: "whole_file", quote: "Payment received: USD 500.00 on July 18, 2026" } },
      { kind: "fact", label: "Outstanding balance", value: "USD 700.00", confidence: 1, locator: { kind: "whole_file", quote: "Outstanding balance: USD 700.00" } },
    ],
    forbiddenValues: ["Paid in full", "No balance due"],
  },
  {
    id: "refund-pending-not-complete",
    fileName: "refund-message.txt",
    documentType: "client_message",
    text: "We started the refund request on 29 July 2026. It is still processing and has not reached your account.",
    expected: [
      { kind: "fact", label: "Refund status", value: "Processing", confidence: 1, locator: { kind: "whole_file", quote: "It is still processing and has not reached your account" } },
    ],
    forbiddenValues: ["Refunded", "Refund received"],
  },
  {
    id: "change-request-not-approval",
    fileName: "change-request.txt",
    documentType: "client_message",
    text: "The homepage is close, but please replace the hero image and resend it. I will approve the delivery after reviewing that change.",
    expected: [
      { kind: "fact", label: "Requested change", value: "Replace the hero image and resend", confidence: 1, locator: { kind: "whole_file", quote: "please replace the hero image and resend it" } },
      { kind: "fact", label: "Approval status", value: "Pending review after change", confidence: 1, uncertainty: "Approval is conditional and has not been given.", locator: { kind: "whole_file", quote: "I will approve the delivery after reviewing that change" } },
    ],
    forbiddenValues: ["Approved", "Delivery accepted"],
  },
  {
    id: "euro-date-format",
    fileName: "invoice-eu.txt",
    documentType: "invoice",
    text: "Rechnungsbetrag: €2.400,00\nFällig am: 31.08.2026\nZahlungsstatus: offen",
    expected: [
      { kind: "fact", label: "Invoice total", value: "€2.400,00", confidence: 1, locator: { kind: "whole_file", quote: "Rechnungsbetrag: €2.400,00" } },
      { kind: "fact", label: "Payment deadline", value: "2026-08-31", confidence: 1, locator: { kind: "whole_file", quote: "Fällig am: 31.08.2026" } },
      { kind: "fact", label: "Payment status", value: "Open", confidence: 1, locator: { kind: "whole_file", quote: "Zahlungsstatus: offen" } },
    ],
  },
  {
    id: "spanish-invoice",
    fileName: "factura-es.txt",
    documentType: "invoice",
    text: "FACTURA 88-A\nTotal pendiente: 18.000 MXN\nFecha límite de pago: 15/09/2026",
    expected: [
      { kind: "fact", label: "Invoice number", value: "88-A", confidence: 1, locator: { kind: "whole_file", quote: "FACTURA 88-A" } },
      { kind: "fact", label: "Outstanding total", value: "18.000 MXN", confidence: 1, locator: { kind: "whole_file", quote: "Total pendiente: 18.000 MXN" } },
      { kind: "fact", label: "Payment deadline", value: "2026-09-15", confidence: 1, locator: { kind: "whole_file", quote: "Fecha límite de pago: 15/09/2026" } },
    ],
  },
  {
    id: "ocr-corrupted-invoice",
    fileName: "ocr-invoice.txt",
    documentType: "invoice",
    text: "INV0ICE N0. A-17\nTota1 due: $1,250.00\nDue d4te: 08/20/2026",
    expected: [
      { kind: "fact", label: "Invoice number", value: "A-17", confidence: 0.8, uncertainty: "The OCR text confuses letters and digits.", locator: { kind: "whole_file", quote: "INV0ICE N0. A-17" } },
      { kind: "fact", label: "Invoice total", value: "$1,250.00", confidence: 0.8, uncertainty: "The OCR text spells total as Tota1.", locator: { kind: "whole_file", quote: "Tota1 due: $1,250.00" } },
      { kind: "fact", label: "Payment deadline", value: "2026-08-20", confidence: 0.8, uncertainty: "The OCR text spells date as d4te.", locator: { kind: "whole_file", quote: "Due d4te: 08/20/2026" } },
    ],
  },
  {
    id: "scheduled-transfer-not-payment",
    fileName: "transfer-note.txt",
    documentType: "payment_record",
    text: "Transfer scheduled\nAmount: GBP 900\nExpected arrival: 3 August 2026\nThis is not a payment confirmation.",
    expected: [
      { kind: "fact", label: "Transfer status", value: "Scheduled", confidence: 1, locator: { kind: "whole_file", quote: "Transfer scheduled" } },
      { kind: "fact", label: "Transfer amount", value: "GBP 900", confidence: 1, locator: { kind: "whole_file", quote: "Amount: GBP 900" } },
    ],
    forbiddenValues: ["Paid", "Payment confirmed", "Payment received"],
  },
];
