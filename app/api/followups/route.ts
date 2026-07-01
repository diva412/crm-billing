import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { followUpSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming"); // "true" -> only future, pending

  const followUps = await prisma.followUp.findMany({
    where: {
      ...(status ? { status: status as "PENDING" | "COMPLETED" | "MISSED" } : {}),
      ...(upcoming === "true"
        ? { status: "PENDING", date: { gte: new Date() } }
        : {}),
    },
    include: { lead: true, customer: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ followUps });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = followUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const followUp = await prisma.followUp.create({ data: parsed.data });

  return NextResponse.json({ followUp }, { status: 201 });
}
