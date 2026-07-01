import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";
import { roundCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quotationId = searchParams.get("quotationId");
  const invoiceId = searchParams.get("invoiceId");

  const payments = await prisma.payment.findMany({
    where: {
      ...(quotationId ? { quotationId } : {}),
      ...(invoiceId ? { invoiceId } : {}),
    },
    include: { quotation: true, invoice: true },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = paymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { quotationId, invoiceId, amount, paidAt, notes } = parsed.data;

  // Guard: advance payment on a quotation must not exceed quotation amount
  if (quotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { payments: true },
    });
    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    const totalPaidSoFar = quotation.payments.reduce(
      (s, p) => s + Number(p.amount),
      0
    );
    const remaining = roundCurrency(
      Number(quotation.finalAmount) - totalPaidSoFar
    );

    if (amount > remaining) {
      return NextResponse.json(
        {
          error: `Payment (${amount}) exceeds the remaining quotation balance (${remaining})`,
        },
        { status: 409 }
      );
    }
  }

  // Guard: direct invoice payment must not exceed invoice balance
  if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const paidOnInvoice = invoice.payments.reduce(
      (s, p) => s + Number(p.amount),
      0
    );
    const remaining = roundCurrency(
      Number(invoice.finalAmount) - paidOnInvoice
    );

    if (amount > remaining) {
      return NextResponse.json(
        {
          error: `Payment (${amount}) exceeds the remaining invoice balance (${remaining})`,
        },
        { status: 409 }
      );
    }
  }

  const payment = await prisma.payment.create({
    data: { quotationId, invoiceId, amount, paidAt, notes },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
