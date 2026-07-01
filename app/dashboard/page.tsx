"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import type { DashboardData } from "@/types";

const fmt = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 });

// ── Stat item for the right sidebar ──────────────────────────────────────────
function StatRow({
  label,
  value,
  color,
  money,
}: {
  label: string;
  value: string | number;
  color: string;
  money?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color,
          background: color + "18",
          padding: "2px 10px",
          borderRadius: 99,
        }}
      >
        {money ? value : value}
      </span>
    </div>
  );
}

// ── Section divider inside stats sidebar ────────────────────────────────────
function StatSection({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: "8px 16px 4px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#94a3b8",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        borderTop: "1px solid #e2e8f0",
        marginTop: 4,
      }}
    >
      {title}
    </div>
  );
}

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
  if (!data)
    return <p style={{ color: "var(--danger)" }}>Failed to load dashboard.</p>;

  const { cards, recent } = data;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

      {/* ── LEFT: Recent tables ───────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Recent Leads */}
        <Section title="Recent Leads" count={recent.recentLeads.length}>
          {recent.recentLeads.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Business</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.name}</strong></td>
                    <td>{l.mobile}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{l.businessName || "—"}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Upcoming Follow-ups */}
        <Section title="Upcoming Follow-ups" count={recent.upcomingFollowUps.length}>
          {recent.upcomingFollowUps.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>With</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.upcomingFollowUps.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.customer?.name ?? f.lead?.name ?? "—"}</strong></td>
                    <td>
                      <span className="badge badge-pending" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                        {f.type}
                      </span>
                    </td>
                    <td>{new Date(f.date).toLocaleDateString("en-IN")}</td>
                    <td>{f.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Quotations */}
        <Section title="Recent Quotations" count={recent.recentQuotations.length}>
          {recent.recentQuotations.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Subtotal</th>
                  <th>GST</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.recentQuotations.map((q) => (
                  <tr key={q.id}>
                    <td><strong>{q.customer?.name ?? "—"}</strong></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{q.service}</td>
                    <td>{fmt(Number(q.subtotal))}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                      {fmt(Number(q.gstAmount))}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                        ({q.gstPercent}%)
                      </span>
                    </td>
                    <td><strong style={{ color: "var(--accent)" }}>{fmt(Number(q.finalAmount))}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Invoices */}
        <Section title="Recent Invoices" count={recent.recentInvoices.length}>
          {recent.recentInvoices.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.quotation?.customer?.name ?? "—"}</strong></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{inv.quotation?.service ?? "—"}</td>
                    <td><strong>{fmt(Number(inv.finalAmount))}</strong></td>
                    <td>{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Current Projects */}
        <Section title="Current Projects" count={recent.currentProjectsList.length}>
          {recent.currentProjectsList.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Customer</th>
                  <th>Start</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recent.currentProjectsList.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.customer?.name ?? "—"}</td>
                    <td>{new Date(p.startDate).toLocaleDateString("en-IN")}</td>
                    <td>
                      {p.deadline
                        ? new Date(p.deadline).toLocaleDateString("en-IN")
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Recent Expenses */}
        <Section title="Recent Expenses" count={recent.recentExpenses.length}>
          {recent.recentExpenses.length === 0 ? (
            <EmptyRow />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.recentExpenses.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>
                      <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(Number(e.amount))}</td>
                    <td>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      {/* ── RIGHT: Stats sidebar ──────────────────────────────────────────── */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
          position: "sticky",
          top: 80,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--sidebar-bg)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.02em",
          }}
        >
          📊 Summary
        </div>

        {/* Counts */}
        <StatSection title="Records" />
        <StatRow label="Total Leads"      value={cards.totalLeads}      color="#1d4ed8" />
        <StatRow label="Total Customers"  value={cards.totalCustomers}  color="#7c3aed" />
        <StatRow label="Total Quotations" value={cards.totalQuotations} color="#0891b2" />
        <StatRow label="Total Invoices"   value={cards.totalInvoices}   color="#059669" />
        <StatRow label="Total Projects"   value={cards.totalProjects}   color="#d97706" />
        <StatRow label="Current Projects"   value={cards.currentProjects}   color="#1d4ed8" />
        <StatRow label="Completed Projects" value={cards.completedProjects} color="#059669" />

        {/* Monthly */}
        <StatSection title="This Month" />
        <StatRow label="Income"   value={fmt(cards.currentMonthIncome)}    color="#059669" money />
        <StatRow label="Expenses" value={fmt(cards.currentMonthExpenses)}  color="#ef4444" money />
        <StatRow
          label="Profit / Loss"
          value={fmt(Math.abs(cards.currentMonthProfit))}
          color={cards.currentMonthProfit >= 0 ? "#059669" : "#ef4444"}
          money
        />

        {/* Billing */}
        <StatSection title="Billing" />
        <StatRow label="Pending Invoice Amt"  value={fmt(cards.pendingInvoiceAmount)} color="#f59e0b" money />
        <StatRow label="Received Payments"    value={fmt(cards.receivedPayments)}     color="#059669" money />
        <StatRow label="Outstanding Balance"  value={fmt(cards.outstandingBalance)}   color="#ef4444" money />

        {/* Tax */}
        <StatSection title="Tax" />
        <StatRow label="Tax Filed"     value={cards.taxFiled}    color="#059669" />
        <StatRow label="Tax Not Filed" value={cards.taxNotFiled} color="#f59e0b" />

        {/* Footer timestamp */}
        <div style={{ padding: "10px 16px", fontSize: 11, color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
          Last updated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          fontWeight: 600,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        {count > 0 && (
          <span
            style={{
              fontSize: 11,
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "2px 8px",
              borderRadius: 99,
              fontWeight: 700,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow() {
  return (
    <div
      style={{
        padding: "24px 16px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 13,
      }}
    >
      No records yet
    </div>
  );
}