import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validations";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search, mode: "insensitive" } },
          { businessName: { contains: search, mode: "insensitive" } },
          { gstNumber: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ customers });
}

// Either create a fresh customer, or convert an existing lead into one by
// passing { fromLeadId } alongside the customer fields.
const createCustomerSchema = customerSchema.extend({
  fromLeadId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { fromLeadId, ...data } = parsed.data;

  if (fromLeadId) {
    const existing = await prisma.customer.findUnique({
      where: { convertedFromLeadId: fromLeadId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This lead has already been converted to a customer" },
        { status: 409 }
      );
    }
  }

  const customer = await prisma.customer.create({
    data: { ...data, convertedFromLeadId: fromLeadId },
  });

  if (fromLeadId) {
    await prisma.lead.update({
      where: { id: fromLeadId },
      data: { status: "CONVERTED" },
    });
  }

  return NextResponse.json({ customer }, { status: 201 });
}
