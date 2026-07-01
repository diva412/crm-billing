import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quotationSchema } from "@/lib/validations";
import { calculateGstBreakdown } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const quotations = await prisma.quotation.findMany({
    where: customerId ? { customerId } : {},
    include: { customer: true, invoices: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quotations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = quotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { customerId, service, description, finalAmount, gstPercent } =
    parsed.data;

  // The only place this formula runs — subtotal/GST are NEVER accepted from the client.
  const { subtotal, gstAmount } = calculateGstBreakdown(
    finalAmount,
    gstPercent
  );

  const quotation = await prisma.quotation.create({
    data: {
      customerId,
      service,
      description,
      finalAmount,
      gstPercent,
      subtotal,
      gstAmount,
    },
  });

  return NextResponse.json({ quotation }, { status: 201 });
}
