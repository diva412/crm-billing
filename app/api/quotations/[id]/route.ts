import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quotationSchema } from "@/lib/validations";
import { calculateGstBreakdown } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      invoices: { include: { payments: true } },
      payments: true, // advance payments linked directly to the quotation
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  return NextResponse.json({ quotation });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = quotationSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.quotation.findUnique({
    where: { id },
    include: { invoices: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const changingAmountOrGst =
    parsed.data.finalAmount !== undefined ||
    parsed.data.gstPercent !== undefined;

  if (changingAmountOrGst && existing.invoices.length > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot change the amount or GST% once invoices have been created against this quotation.",
      },
      { status: 409 }
    );
  }

  let recomputed = {};
  if (changingAmountOrGst) {
    const finalAmount = parsed.data.finalAmount ?? Number(existing.finalAmount);
    const gstPercent = parsed.data.gstPercent ?? Number(existing.gstPercent);
    const { subtotal, gstAmount } = calculateGstBreakdown(
      finalAmount,
      gstPercent
    );
    recomputed = { subtotal, gstAmount };
  }

  const quotation = await prisma.quotation.update({
    where: { id },
    data: { ...parsed.data, ...recomputed },
  });

  return NextResponse.json({ quotation });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const existing = await prisma.quotation.findUnique({
    where: { id },
    include: { invoices: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  if (existing.invoices.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete a quotation that has invoices" },
      { status: 409 }
    );
  }

  await prisma.quotation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
