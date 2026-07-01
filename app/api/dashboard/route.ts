import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roundCurrency } from "@/lib/utils";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function GET() {
  const { start, end } = currentMonthRange();

  const [
    totalLeads,
    totalCustomers,
    totalQuotations,
    totalInvoices,
    totalProjects,
    currentProjects,
    completedProjects,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.customer.count(),
    prisma.quotation.count(),
    prisma.invoice.count(),
    prisma.project.count(),
    prisma.project.count({ where: { status: "CURRENT" } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
  ]);

  const monthlyPayments = await prisma.payment.findMany({
    where: { paidAt: { gte: start, lt: end } },
  });
  const currentMonthIncome = roundCurrency(
    monthlyPayments.reduce((s, p) => s + Number(p.amount), 0)
  );

  const monthlyExpenses = await prisma.expense.aggregate({
    where: { date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const currentMonthExpenses = roundCurrency(
    Number(monthlyExpenses._sum.amount ?? 0)
  );

  const currentMonthProfit = roundCurrency(
    currentMonthIncome - currentMonthExpenses
  );

  const allInvoices = await prisma.invoice.findMany({
    include: { payments: true },
  });
  const allPaymentsOnInvoices = allInvoices.reduce(
    (s, inv) =>
      s + inv.payments.reduce((ps, p) => ps + Number(p.amount), 0),
    0
  );
  const totalInvoicedAmount = allInvoices.reduce(
    (s, inv) => s + Number(inv.finalAmount),
    0
  );

  const advancePaymentsTotal = await prisma.payment.aggregate({
    where: { invoiceId: null },
    _sum: { amount: true },
  });
  const totalAdvance = Number(advancePaymentsTotal._sum.amount ?? 0);

  const receivedPayments = roundCurrency(
    allPaymentsOnInvoices + totalAdvance
  );
  const pendingInvoiceAmount = roundCurrency(
    totalInvoicedAmount - allPaymentsOnInvoices
  );
  const outstandingBalance = roundCurrency(
    totalInvoicedAmount - receivedPayments
  );

  const [taxFiled, taxNotFiled] = await Promise.all([
    prisma.quotation.count({ where: { taxFiled: true } }),
    prisma.quotation.count({ where: { taxFiled: false } }),
  ]);

  const [
    recentLeads,
    upcomingFollowUps,
    recentQuotations,
    recentInvoices,
    currentProjectsList,
    recentExpenses,
  ] = await Promise.all([
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.followUp.findMany({
      where: { status: "PENDING", date: { gte: new Date() } },
      include: { lead: true, customer: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.quotation.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      include: { quotation: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.findMany({
      where: { status: "CURRENT" },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    cards: {
      totalLeads,
      totalCustomers,
      totalQuotations,
      totalInvoices,
      totalProjects,
      currentProjects,
      completedProjects,
      currentMonthIncome,
      currentMonthExpenses,
      currentMonthProfit,
      pendingInvoiceAmount,
      receivedPayments,
      outstandingBalance,
      taxFiled,
      taxNotFiled,
    },
    recent: {
      recentLeads,
      upcomingFollowUps,
      recentQuotations,
      recentInvoices,
      currentProjectsList,
      recentExpenses,
    },
  });
}
