import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validations";
import { calculateGstBreakdown, assertInvoiceWithinQuotation } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quotationId = searchParams.get("quotationId");

  const invoices = await prisma.invoice.findMany({
    where: quotationId ? { quotationId } : {},
    include: {
      quotation: { include: { customer: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = invoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { quotationId, finalAmount } = parsed.data;

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { invoices: true },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const existingInvoiceTotal = quotation.invoices.reduce(
    (sum, inv) => sum + Number(inv.finalAmount),
    0
  );

  try {
    assertInvoiceWithinQuotation(
      Number(quotation.finalAmount),
      existingInvoiceTotal,
      finalAmount
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid invoice amount" },
      { status: 409 }
    );
  }

  // Invoice inherits the quotation's GST rate — it's a partial draw on the
  // same GST-inclusive total, not a separately negotiated rate.
  const gstPercent = Number(quotation.gstPercent);
  const { subtotal, gstAmount } = calculateGstBreakdown(
    finalAmount,
    gstPercent
  );

  const invoice = await prisma.invoice.create({
    data: {
      quotationId,
      finalAmount,
      gstPercent,
      subtotal,
      gstAmount,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}
