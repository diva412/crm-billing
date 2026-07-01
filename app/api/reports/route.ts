import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roundCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // income | expense | profit | pending | received | projects | tax
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

  const dateFilter = from || to
    ? { gte: from, ...(to ? { lte: to } : {}) }
    : undefined;

  switch (type) {
    case "income": {
      const payments = await prisma.payment.findMany({
        where: dateFilter ? { paidAt: dateFilter } : {},
        include: { quotation: { include: { customer: true } }, invoice: true },
        orderBy: { paidAt: "desc" },
      });
      const total = roundCurrency(payments.reduce((s, p) => s + Number(p.amount), 0));
      return NextResponse.json({ type, payments, total });
    }

    case "expense": {
      const expenses = await prisma.expense.findMany({
        where: dateFilter ? { date: dateFilter } : {},
        orderBy: { date: "desc" },
      });
      const total = roundCurrency(expenses.reduce((s, e) => s + Number(e.amount), 0));
      return NextResponse.json({ type, expenses, total });
    }

    case "profit": {
      const [payments, expenseAgg] = await Promise.all([
        prisma.payment.aggregate({
          where: dateFilter ? { paidAt: dateFilter } : {},
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: dateFilter ? { date: dateFilter } : {},
          _sum: { amount: true },
        }),
      ]);
      const income = roundCurrency(Number(payments._sum.amount ?? 0));
      const expense = roundCurrency(Number(expenseAgg._sum.amount ?? 0));
      const profit = roundCurrency(income - expense);
      return NextResponse.json({ type, income, expense, profit });
    }

    case "pending": {
      const invoices = await prisma.invoice.findMany({
        include: {
          payments: true,
          quotation: { include: { customer: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      const pending = invoices
        .map((inv) => {
          const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
          return { ...inv, balance: roundCurrency(Number(inv.finalAmount) - paid) };
        })
        .filter((inv) => inv.balance > 0);
      const total = roundCurrency(pending.reduce((s, inv) => s + inv.balance, 0));
      return NextResponse.json({ type, invoices: pending, total });
    }

    case "received": {
      const payments = await prisma.payment.findMany({
        where: dateFilter ? { paidAt: dateFilter } : {},
        include: { invoice: true, quotation: { include: { customer: true } } },
        orderBy: { paidAt: "desc" },
      });
      const total = roundCurrency(payments.reduce((s, p) => s + Number(p.amount), 0));
      return NextResponse.json({ type, payments, total });
    }

    case "projects_current": {
      const projects = await prisma.project.findMany({
        where: { status: "CURRENT" },
        include: { customer: true, quotation: true },
      });
      return NextResponse.json({ type, projects });
    }

    case "projects_completed": {
      const projects = await prisma.project.findMany({
        where: { status: "COMPLETED" },
        include: { customer: true, quotation: true },
      });
      return NextResponse.json({ type, projects });
    }

    case "tax_filed": {
      // Placeholder: no dedicated tax module in spec
      return NextResponse.json({ type, records: [], total: 0 });
    }

    case "tax_pending": {
      return NextResponse.json({ type, records: [], total: 0 });
    }

    default:
      return NextResponse.json(
        { error: "type is required. Valid: income | expense | profit | pending | received | projects_current | projects_completed | tax_filed | tax_pending" },
        { status: 400 }
      );
  }
}
