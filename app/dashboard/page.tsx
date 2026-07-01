"use client";
import { useEffect, useState } from "react";
import StatCard from "@/components/cards/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import type { DashboardData } from "@/types";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p style={{ color: "var(--danger)" }}>Failed to load dashboard.</p>;

  const { cards, recent } = data;

  return (
    <div>
      {/* Row 1: counts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14, marginBottom: 16 }}>
        <StatCard label="Total Leads" value={cards.totalLeads} color="#1d4ed8" />
        <StatCard label="Total Customers" value={cards.totalCustomers} color="#7c3aed" />
        <StatCard label="Total Quotations" value={cards.totalQuotations} color="#0891b2" />
        <StatCard label="Total Invoices" value={cards.totalInvoices} color="#059669" />
        <StatCard label="Total Projects" value={cards.totalProjects} color="#d97706" />
        <StatCard label="Current Projects" value={cards.currentProjects} color="#1d4ed8" />
        <StatCard label="Completed Projects" value={cards.completedProjects} color="#059669" />
      </div>

      {/* Row 2: money */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard label="This Month Income" value={fmt(cards.currentMonthIncome)} color="#059669" />
        <StatCard label="This Month Expenses" value={fmt(cards.currentMonthExpenses)} color="#ef4444" />
        <StatCard label="This Month Profit" value={fmt(cards.currentMonthProfit)}
          color={cards.currentMonthProfit >= 0 ? "#059669" : "#ef4444"} />
        <StatCard label="Pending Invoice Amt" value={fmt(cards.pendingInvoiceAmount)} color="#f59e0b" />
        <StatCard label="Received Payments" value={fmt(cards.receivedPayments)} color="#059669" />
        <StatCard label="Outstanding Balance" value={fmt(cards.outstandingBalance)} color="#ef4444" />
        <StatCard label="Tax Filed" value={cards.taxFiled} color="#059669" />
        <StatCard label="Tax Not Filed" value={cards.taxNotFiled} color="#f59e0b" />
      </div>

      {/* Recent sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Recent Leads */}
        <Section title="Recent Leads">
          {recent.recentLeads.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Mobile</th><th>Status</th></tr></thead>
              <tbody>
                {recent.recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.mobile}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Upcoming Follow-ups */}
        <Section title="Upcoming Follow-ups">
          {recent.upcomingFollowUps.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead><tr><th>With</th><th>Type</th><th>Date</th></tr></thead>
              <tbody>
                {recent.upcomingFollowUps.map((f) => (
                  <tr key={f.id}>
                    <td>{f.customer?.name ?? f.lead?.name ?? "—"}</td>
                    <td>{f.type}</td>
                    <td>{new Date(f.date).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Quotations */}
        <Section title="Recent Quotations">
          {recent.recentQuotations.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Service</th><th>Amount</th></tr></thead>
              <tbody>
                {recent.recentQuotations.map((q) => (
                  <tr key={q.id}>
                    <td>{q.customer?.name ?? "—"}</td>
                    <td>{q.service}</td>
                    <td>{fmt(Number(q.finalAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Invoices */}
        <Section title="Recent Invoices">
          {recent.recentInvoices.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead><tr><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {recent.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.quotation?.customer?.name ?? "—"}</td>
                    <td>{fmt(Number(inv.finalAmount))}</td>
                    <td>{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Current Projects */}
        <Section title="Current Projects">
          {recent.currentProjectsList.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead><tr><th>Project</th><th>Customer</th><th>Deadline</th></tr></thead>
              <tbody>
                {recent.currentProjectsList.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.customer?.name ?? "—"}</td>
                    <td>{p.deadline ? new Date(p.deadline).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Expenses */}
        <Section title="Recent Expenses">
          {recent.recentExpenses.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Category</th><th>Amount</th></tr></thead>
              <tbody>
                {recent.recentExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.category}</td>
                    <td>{fmt(Number(e.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function EmptyRow() {
  return (
    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      No records yet
    </div>
  );
}
