"use client";
import { useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";

const fmt = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const REPORT_TYPES = [
  { value: "income",             label: "Income",              color: "#059669" },
  { value: "expense",            label: "Expenses",            color: "#ef4444" },
  { value: "profit",             label: "Profit / Loss",       color: "#1d4ed8" },
  { value: "pending",            label: "Pending Payments",    color: "#f59e0b" },
  { value: "received",           label: "Received Payments",   color: "#059669" },
  { value: "projects_current",   label: "Current Projects",    color: "#1d4ed8" },
  { value: "projects_completed", label: "Completed Projects",  color: "#7c3aed" },
  { value: "tax_filed",          label: "Tax Filed",           color: "#059669" },
  { value: "tax_pending",        label: "Tax Pending",         color: "#f59e0b" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("income");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function runReport() {
    setLoading(true);
    setData(null);
    const params = new URLSearchParams({ type: reportType });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/reports?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  const active = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Reports</h2>
      </div>

      {/* Report selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {REPORT_TYPES.map((r) => (
          <button
            key={r.value}
            onClick={() => { setReportType(r.value); setData(null); }}
            style={{
              padding: "7px 14px",
              borderRadius: 99,
              border: `2px solid ${reportType === r.value ? r.color : "var(--border)"}`,
              background: reportType === r.value ? r.color : "#fff",
              color: reportType === r.value ? "#fff" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Date range + run */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: 160 }}>
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={runReport} disabled={loading}>
          {loading ? "Running…" : `Run ${active?.label ?? ""} Report`}
        </button>
        {(from || to) && (
          <button className="btn btn-ghost" onClick={() => { setFrom(""); setTo(""); setData(null); }}>
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {loading && <LoadingSpinner />}

      {!loading && data && (
        <div>
          {/* ── Income ── */}
          {data.type === "income" && (
            <ReportShell title="Income Report" total={data.total as number} color="#059669" label="Total Received">
              <PaymentsTable payments={data.payments as never[]} />
            </ReportShell>
          )}

          {/* ── Expense ── */}
          {data.type === "expense" && (
            <ReportShell title="Expense Report" total={data.total as number} color="#ef4444" label="Total Spent">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>
                  {(data.expenses as never[]).map((e: Record<string, unknown>, i: number) => (
                    <tr key={i}>
                      <td>{e.name as string}</td>
                      <td><span className="badge badge-current" style={{ background: "#f1f5f9", color: "#64748b" }}>{e.category as string}</span></td>
                      <td style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(Number(e.amount))}</td>
                      <td>{new Date(e.date as string).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportShell>
          )}

          {/* ── Profit ── */}
          {data.type === "profit" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
              <SummaryBox label="Income" value={fmt(data.income as number)} color="#059669" />
              <SummaryBox label="Expenses" value={fmt(data.expense as number)} color="#ef4444" />
              <SummaryBox
                label={(data.profit as number) >= 0 ? "Profit" : "Loss"}
                value={fmt(Math.abs(data.profit as number))}
                color={(data.profit as number) >= 0 ? "#1d4ed8" : "#ef4444"}
              />
            </div>
          )}

          {/* ── Pending ── */}
          {data.type === "pending" && (
            <ReportShell title="Pending Payments" total={data.total as number} color="#f59e0b" label="Total Outstanding">
              <table className="data-table">
                <thead><tr><th>Customer</th><th>Service</th><th>Invoice Total</th><th>Balance Due</th></tr></thead>
                <tbody>
                  {(data.invoices as never[]).map((inv: Record<string, unknown>, i: number) => (
                    <tr key={i}>
                      <td>{(inv.quotation as Record<string, unknown>)?.customer?.name as string ?? "—"}</td>
                      <td>{(inv.quotation as Record<string, unknown>)?.service as string ?? "—"}</td>
                      <td>{fmt(Number(inv.finalAmount))}</td>
                      <td style={{ fontWeight: 700, color: "var(--warning)" }}>{fmt(Number(inv.balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportShell>
          )}

          {/* ── Received ── */}
          {data.type === "received" && (
            <ReportShell title="Received Payments" total={data.total as number} color="#059669" label="Total Received">
              <PaymentsTable payments={data.payments as never[]} />
            </ReportShell>
          )}

          {/* ── Projects current/completed ── */}
          {(data.type === "projects_current" || data.type === "projects_completed") && (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Project</th><th>Customer</th><th>Quotation</th><th>Start</th><th>Deadline</th><th>Status</th></tr></thead>
                <tbody>
                  {(data.projects as never[]).map((p: Record<string, unknown>, i: number) => (
                    <tr key={i}>
                      <td><strong>{p.name as string}</strong></td>
                      <td>{(p.customer as Record<string, unknown>)?.name as string ?? "—"}</td>
                      <td>{(p.quotation as Record<string, unknown>)?.service as string ?? "—"}</td>
                      <td>{new Date(p.startDate as string).toLocaleDateString("en-IN")}</td>
                      <td>{p.deadline ? new Date(p.deadline as string).toLocaleDateString("en-IN") : "—"}</td>
                      <td><StatusBadge status={p.status as string} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data.projects as unknown[]).length === 0 && (
                <div className="empty-state"><h3>No records</h3><p>No projects match this filter.</p></div>
              )}
            </div>
          )}

          {/* ── Tax ── */}
          {(data.type === "tax_filed" || data.type === "tax_pending") && (
            <div className="empty-state" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8 }}>
              <h3>Tax module not yet configured</h3>
              <p>Tax tracking will be available in the next release. Configure it in Settings.</p>
            </div>
          )}
        </div>
      )}

      {!loading && !data && (
        <div className="empty-state" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8 }}>
          <h3>Select a report type and run</h3>
          <p>Choose a report above, optionally set a date range, then click Run.</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ReportShell({
  title, total, color, label, children,
}: {
  title: string; total: number; color: string; label: string; children: React.ReactNode;
}) {
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <div style={{ background: color, color: "#fff", padding: "8px 20px", borderRadius: 8, fontWeight: 700 }}>
          {label}: {fmt(total)}
        </div>
      </div>
      <div className="card">{children}</div>
    </div>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: `2px solid ${color}`, borderRadius: 10, padding: "24px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function PaymentsTable({ payments }: { payments: Record<string, unknown>[] }) {
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  return (
    <table className="data-table">
      <thead><tr><th>Customer</th><th>Type</th><th>Amount</th><th>Date</th><th>Notes</th></tr></thead>
      <tbody>
        {payments.map((p, i) => (
          <tr key={i}>
            <td>
              {((p.quotation as Record<string, unknown>)?.customer as Record<string, unknown>)?.name as string ??
               ((p.invoice as Record<string, unknown>)?.quotation as Record<string, unknown>)?.customer?.name as string ?? "—"}
            </td>
            <td>
              <span className={`badge ${p.invoiceId ? "badge-current" : "badge-follow_up"}`}>
                {p.invoiceId ? "Invoice" : "Advance"}
              </span>
            </td>
            <td style={{ color: "var(--success)", fontWeight: 600 }}>{fmt(Number(p.amount))}</td>
            <td>{new Date(p.paidAt as string).toLocaleDateString("en-IN")}</td>
            <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{p.notes as string || "—"}</td>
          </tr>
        ))}
        {payments.length === 0 && (
          <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No records found</td></tr>
        )}
      </tbody>
    </table>
  );
}
