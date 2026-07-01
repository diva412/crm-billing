import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tax?status=filed|pending
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "filed" | "pending" | null = all

  const where =
    status === "filed"
      ? { taxFiled: true }
      : status === "pending"
      ? { taxFiled: false }
      : {};

  const quotations = await prisma.quotation.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const totalGstFiled = quotations
    .filter((q) => q.taxFiled)
    .reduce((s, q) => s + Number(q.gstAmount), 0);

  const totalGstPending = quotations
    .filter((q) => !q.taxFiled)
    .reduce((s, q) => s + Number(q.gstAmount), 0);

  return NextResponse.json({
    quotations,
    summary: {
      filed: quotations.filter((q) => q.taxFiled).length,
      pending: quotations.filter((q) => !q.taxFiled).length,
      totalGstFiled: Math.round(totalGstFiled * 100) / 100,
      totalGstPending: Math.round(totalGstPending * 100) / 100,
    },
  });
}

// PATCH /api/tax  body: { quotationId, taxFiled: boolean }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { quotationId, taxFiled } = body;

  if (!quotationId || typeof taxFiled !== "boolean") {
    return NextResponse.json(
      { error: "quotationId and taxFiled (boolean) are required" },
      { status: 400 }
    );
  }

  const quotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      taxFiled,
      taxFiledAt: taxFiled ? new Date() : null,
    },
  });

  return NextResponse.json({ quotation });
}