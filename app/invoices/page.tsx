"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Invoice, Quotation } from "@/types";

const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [finalAmount, setFinalAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [iRes, qRes] = await Promise.all([fetch("/api/invoices"), fetch("/api/quotations")]);
    const [iData, qData] = await Promise.all([iRes.json(), qRes.json()]);
    setInvoices(iData.invoices ?? []);
    setQuotations(qData.quotations ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setSelectedQuotation(null); setFinalAmount(""); setModal(true); }
  function closeModal() { setModal(false); setSelectedQuotation(null); setFinalAmount(""); }

  // Show how much remains on the selected quotation
  const existingOnQuotation = selectedQuotation
    ? (selectedQuotation.invoices ?? []).reduce((s, inv) => s + Number(inv.finalAmount), 0)
    : 0;
  const remainingOnQuotation = selectedQuotation
    ? Number(selectedQuotation.finalAmount) - existingOnQuotation
    : 0;

  // Live preview
  const fa = parseFloat(finalAmount);
  const preview = selectedQuotation && fa > 0 ? (() => {
    const gstPercent = Number(selectedQuotation.gstPercent);
    const subtotal = fa / (1 + gstPercent / 100);
    const gstAmount = fa - subtotal;
    return { subtotal: Math.round(subtotal * 100) / 100, gstAmount: Math.round(gstAmount * 100) / 100 };
  })() : null;

  async function handleSave() {
    if (!selectedQuotation) { toast("Select a quotation", "error"); return; }
    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationId: selectedQuotation.id, finalAmount: fa }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error creating invoice", "error"); return; }
    toast("Invoice created");
    closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false); setDeleteTarget(null);
    if (!res.ok) { toast(data.error ?? "Failed to delete", "error"); return; }
    toast("Invoice deleted"); load();
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Invoices</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Invoice</button>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : invoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices yet</h3>
            <p>Create invoices from existing quotations.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ New Invoice</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Customer</th><th>Quotation</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.quotation?.customer?.name ?? "—"}</strong></td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{inv.quotation?.service ?? "—"}</td>
                  <td>{fmt(Number(inv.subtotal))}</td>
                  <td>{fmt(Number(inv.gstAmount))} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({inv.gstPercent}%)</span></td>
                  <td><strong>{fmt(Number(inv.finalAmount))}</strong></td>
                  <td>{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(inv)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Invoice</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Quotation *</label>
                  <select className="form-input" value={selectedQuotation?.id ?? ""}
                    onChange={(e) => {
                      const q = quotations.find((q) => q.id === e.target.value);
                      setSelectedQuotation(q ?? null);
                      setFinalAmount("");
                    }}>
                    <option value="">Select quotation</option>
                    {quotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.customer?.name} — {q.service} ({fmt(Number(q.finalAmount))})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedQuotation && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 14px", fontSize: 13 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Quotation summary</div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Total: </span><strong>{fmt(Number(selectedQuotation.finalAmount))}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Invoiced: </span><strong>{fmt(existingOnQuotation)}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Remaining: </span><strong style={{ color: "var(--accent)" }}>{fmt(remainingOnQuotation)}</strong></div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Invoice Amount (incl. GST) *</label>
                  <input type="number" className="form-input" value={finalAmount}
                    placeholder={selectedQuotation ? `Max: ₹${remainingOnQuotation.toLocaleString("en-IN")}` : "Select a quotation first"}
                    disabled={!selectedQuotation}
                    onChange={(e) => setFinalAmount(e.target.value)} />
                </div>

                {preview && (
                  <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                      Auto-calculated
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Subtotal</div><div style={{ fontWeight: 700 }}>{fmt(preview.subtotal)}</div></div>
                      <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>GST ({selectedQuotation?.gstPercent}%)</div><div style={{ fontWeight: 700 }}>{fmt(preview.gstAmount)}</div></div>
                      <div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total</div><div style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(fa)}</div></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selectedQuotation || !finalAmount}>
                {saving ? "Saving…" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Invoice"
        message="Delete this invoice? This will fail if payments have been made against it."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
