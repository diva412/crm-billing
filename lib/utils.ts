/**
 * Billing math shared by the Quotation and Invoice modules.
 *
 * Every amount entered by the user (quotation finalAmount, invoice finalAmount)
 * is GST-INCLUSIVE. The subtotal and GST amount are always derived, never
 * accepted as direct input. Keeping this in one place means the dashboard,
 * quotation API, and invoice API can never disagree on the formula.
 */

export interface GstBreakdown {
  finalAmount: number;
  gstPercent: number;
  subtotal: number;
  gstAmount: number;
}

/**
 * Given a GST-inclusive final amount and a GST percentage, derive the
 * subtotal and GST amount.
 *
 * subtotal = finalAmount / (1 + gstPercent / 100)
 * gstAmount = finalAmount - subtotal
 *
 * Rounded to 2 decimal places (currency precision) at the end only, to avoid
 * compounding rounding error in intermediate steps.
 */
export function calculateGstBreakdown(
  finalAmount: number,
  gstPercent: number
): GstBreakdown {
  if (finalAmount <= 0) {
    throw new Error("finalAmount must be greater than zero");
  }
  if (gstPercent < 0) {
    throw new Error("gstPercent cannot be negative");
  }

  const subtotalRaw = finalAmount / (1 + gstPercent / 100);
  const subtotal = roundCurrency(subtotalRaw);
  const gstAmount = roundCurrency(finalAmount - subtotal);

  return { finalAmount, gstPercent, subtotal, gstAmount };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validate that creating a new invoice for `finalAmount` would not push the
 * sum of all invoices for this quotation past the quotation's finalAmount.
 * Returns the remaining amount available, and throws if the new invoice
 * would exceed it.
 */
export function assertInvoiceWithinQuotation(
  quotationFinalAmount: number,
  existingInvoiceTotal: number,
  newInvoiceAmount: number
): { remainingBeforeThisInvoice: number } {
  const remainingBeforeThisInvoice = roundCurrency(
    quotationFinalAmount - existingInvoiceTotal
  );

  if (newInvoiceAmount > remainingBeforeThisInvoice) {
    throw new Error(
      `Invoice amount (${newInvoiceAmount}) exceeds the remaining quotation balance (${remainingBeforeThisInvoice}).`
    );
  }

  return { remainingBeforeThisInvoice };
}

/**
 * Compute the outstanding balance on an invoice.
 *
 * Balance = invoice.finalAmount
 *           - (sum of payments linked directly to this invoice)
 *           - (unused quotation-level advance payments, capped at what this
 *              invoice still needs after direct payments)
 *
 * "Unused" quotation advance = total advance payments on the quotation minus
 * whatever has already been consumed by earlier invoices (in creation order).
 * Payments never change GST figures — they only reduce balance.
 */
export function calculateInvoiceBalance(params: {
  invoiceFinalAmount: number;
  directInvoicePayments: number; // sum of Payment.amount where invoiceId = this invoice
  quotationAdvanceAvailable: number; // unused advance remaining on the quotation, see below
}): { balance: number; advanceApplied: number } {
  const { invoiceFinalAmount, directInvoicePayments, quotationAdvanceAvailable } =
    params;

  const afterDirectPayments = roundCurrency(
    invoiceFinalAmount - directInvoicePayments
  );

  if (afterDirectPayments <= 0) {
    return { balance: 0, advanceApplied: 0 };
  }

  const advanceApplied = Math.min(
    quotationAdvanceAvailable,
    afterDirectPayments
  );
  const balance = roundCurrency(afterDirectPayments - advanceApplied);

  return { balance, advanceApplied: roundCurrency(advanceApplied) };
}

/**
 * Given all advance payments on a quotation (payments with invoiceId = null)
 * and all invoices already created for it (oldest first), compute how much
 * advance is still unconsumed. Each invoice "claims" advance in creation
 * order, up to what it still needs after its own direct payments.
 */
export function calculateUnusedQuotationAdvance(params: {
  totalQuotationAdvance: number;
  invoicesOldestFirst: { finalAmount: number; directPayments: number }[];
}): number {
  let remainingAdvance = params.totalQuotationAdvance;

  for (const invoice of params.invoicesOldestFirst) {
    const stillNeeded = roundCurrency(
      invoice.finalAmount - invoice.directPayments
    );
    if (stillNeeded <= 0) continue;

    const claimed = Math.min(remainingAdvance, stillNeeded);
    remainingAdvance = roundCurrency(remainingAdvance - claimed);
  }

  return remainingAdvance;
}
