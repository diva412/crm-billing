import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateInvoiceBalance,
  calculateUnusedQuotationAdvance,
} from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      payments: true,
      quotation: {
        include: {
          customer: true,
          payments: true,
          invoices: {
            include: { payments: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const directInvoicePayments = invoice.payments.reduce(
    (s, p) => s + Number(p.amount),
    0
  );

  const totalAdvance = invoice.quotation.payments.reduce(
    (s, p) => s + Number(p.amount),
    0
  );

  // Build the invoice list in creation order so advance is consumed correctly
  const invoicesOldestFirst = invoice.quotation.invoices.map((inv) => ({
    finalAmount: Number(inv.finalAmount),
    directPayments: inv.payments.reduce((s, p) => s + Number(p.amount), 0),
  }));

  const unusedAdvance = calculateUnusedQuotationAdvance({
    totalQuotationAdvance: totalAdvance,
    invoicesOldestFirst,
  });

  const { balance, advanceApplied } = calculateInvoiceBalance({
    invoiceFinalAmount: Number(invoice.finalAmount),
    directInvoicePayments,
    quotationAdvanceAvailable: unusedAdvance,
  });

  const invoiceSummary = {
    ...invoice,
    balance,
    advanceApplied,
    alreadyReceived: directInvoicePayments + advanceApplied,
  };

  return NextResponse.json({ invoice: invoiceSummary });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.payments.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete an invoice that has payments against it" },
      { status: 409 }
    );
  }

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
