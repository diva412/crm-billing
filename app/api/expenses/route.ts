import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const month = searchParams.get("month"); // format: YYYY-MM

  let dateFilter = {};
  if (month) {
    const [year, monthNum] = month.split("-").map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 1);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const expenses = await prisma.expense.findMany({
    where: {
      ...(category
        ? {
            category: category as
              | "SALARY"
              | "SOFTWARE"
              | "DOMAIN"
              | "SERVER"
              | "MARKETING"
              | "OFFICE"
              | "TRAVEL"
              | "OTHERS",
          }
        : {}),
      ...dateFilter,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = expenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({ data: parsed.data });

  return NextResponse.json({ expense }, { status: 201 });
}
