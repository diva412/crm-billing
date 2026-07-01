"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";

const fmt = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

interface TaxQuotation {
  id: string;
  service: string;
  finalAmount: number;
  gstPercent: number;
  gstAmount: number;
  taxFiled: boolean;
  taxFiledAt?: string;
  createdAt: string;
  customer: { name: string; gstNumber?: string };
}

interface Summary {
  filed: number;
  pending: number;
  totalGstFiled: number;
  totalGstPending: number;
}

export default function TaxPage() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<TaxQuotation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "filed" | "pending">("all");
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/tax${params}`);
    const data = await res.json();
    setQuotations(data.quotations ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function toggleTax(quotationId: string, currentStatus: boolean) {
    setToggling(quotationId);
    const res = await fetch("/api/tax", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationId, taxFiled: !currentStatus }),
    });
    const data = await res.json();
    setToggling(null);
    if (!res.ok) { toast(data.error ?? "Failed to update", "error"); return; }
    toast(!currentStatus ? "✓ Marked as Tax Filed" : "Marked as Tax Pending");
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tax Management</h2>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          <SummaryCard
            label="Tax Filed"
            value={String(summary.filed)}
            sub="Quotations"
            color="#059669"
          />
          <SummaryCard
            label="Tax Pending"
            value={String(summary.pending)}
            sub="Quotations"
            color="#f59e0b"
          />
          <SummaryCard
            label="GST Filed"
            value={fmt(summary.totalGstFiled)}
            sub="Total GST submitted"
            color="#1d4ed8"
          />
          <SummaryCard
            label="GST Pending"
            value={fmt(summary.totalGstPending)}
            sub="Total GST to submit"
            color="#ef4444"
          />
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all", "pending", "filed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              background: filter === f ? "var(--accent)" : "#fff",
              color: filter === f ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
              fontWeight: 600,
              fontSize: 13,
              padding: "6px 18px",
            }}
          >
            {f === "all" ? "All" : f === "filed" ? "✓ Filed" : "⏳ Pending"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner />
        ) : quotations.length === 0 ? (
          <div className="empty-state">
            <h3>
              {filter === "filed"
                ? "No filed quotations yet"
                : filter === "pending"
                ? "All quotations are filed!"
                : "No quotations found"}
            </h3>
            <p>
              {filter === "pending"
                ? "Great job — nothing pending."
                : "Create quotations first, then mark their GST as filed here."}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>GST No.</th>
                <th>Service</th>
                <th>Final Amt</th>
                <th>GST %</th>
                <th>GST Amount</th>
                <th>Created</th>
                <th>Filed On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td><strong>{q.customer.name}</strong></td>
                  <td>
                    <code style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {q.customer.gstNumber || "—"}
                    </code>
                  </td>
                  <td>{q.service}</td>
                  <td><strong>{fmt(Number(q.finalAmount))}</strong></td>
                  <td style={{ color: "var(--text-secondary)" }}>{q.gstPercent}%</td>
                  <td style={{ color: "#1d4ed8", fontWeight: 700 }}>
                    {fmt(Number(q.gstAmount))}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {new Date(q.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {q.taxFiledAt ? (
                      <span style={{ color: "#059669", fontWeight: 600 }}>
                        {new Date(q.taxFiledAt).toLocaleDateString("en-IN")}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    {q.taxFiled ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        ✓ Filed
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#fef9c3",
                          color: "#a16207",
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        ⏳ Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${q.taxFiled ? "btn-ghost" : "btn-primary"}`}
                      disabled={toggling === q.id}
                      onClick={() => toggleTax(q.id, q.taxFiled)}
                      style={{ minWidth: 100 }}
                    >
                      {toggling === q.id
                        ? "Updating…"
                        : q.taxFiled
                        ? "Mark Pending"
                        : "Mark Filed"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${color}`,
        borderRadius: 8,
        padding: "16px 20px",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}