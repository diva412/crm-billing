"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Payment, Quotation, Invoice } from "@/types";

const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

type LinkType = "quotation" | "invoice";

const EMPTY = { linkType: "invoice" as LinkType, quotationId: "", invoiceId: "", amount: "", paidAt: "", notes: "" };

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [pRes, qRes, iRes] = await Promise.all([
      fetch("/api/payments"), fetch("/api/quotations"), fetch("/api/invoices"),
    ]);
    const [pData, qData, iData] = await Promise.all([pRes.json(), qRes.json(), iRes.json()]);
    setPayments(pData.payments ?? []);
    setQuotations(qData.quotations ?? []);
    setInvoices(iData.invoices ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setModal(true); }
  function closeModal() { setModal(false); setForm(EMPTY); }

  async function handleSave() {
    setSaving(true);
    const payload = {
      amount: parseFloat(form.amount),
      paidAt: form.paidAt || undefined,
      notes: form.notes || undefined,
      quotationId: form.linkType === "quotation" ? form.quotationId || undefined : undefined,
      invoiceId: form.linkType === "invoice" ? form.invoiceId || undefined : undefined,
    };
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error recording payment", "error"); return; }
    toast("Payment recorded");
    closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/payments/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    toast("Payment deleted"); load();
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Payments</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Record Payment</button>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : payments.length === 0 ? (
          <div className="empty-state">
            <h3>No payments recorded</h3>
            <p>Record a payment against an invoice or as an advance on a quotation.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ Record Payment</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Linked To</th><th>Customer</th><th>Amount</th><th>Date</th><th>Notes</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className={`badge ${p.invoiceId ? "badge-current" : "badge-follow_up"}`}>
                      {p.invoiceId ? "Invoice" : "Advance"}
                    </span>
                  </td>
                  <td>{p.quotation?.customer?.name ?? p.invoice?.quotation?.customer?.name ?? "—"}</td>
                  <td><strong style={{ color: "var(--success)" }}>{fmt(Number(p.amount))}</strong></td>
                  <td>{new Date(p.paidAt).toLocaleDateString("en-IN")}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{p.notes || "—"}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>Delete</button>
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
              <span className="modal-title">Record Payment</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Payment type toggle */}
                <div className="form-group">
                  <label className="form-label">Payment type</label>
                  <div style={{ display: "flex", gap: 16 }}>
                    {(["invoice", "quotation"] as LinkType[]).map((t) => (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input type="radio" checked={form.linkType === t}
                          onChange={() => setForm((p) => ({ ...p, linkType: t, invoiceId: "", quotationId: "" }))} />
                        {t === "invoice" ? "Against Invoice" : "Advance (against Quotation)"}
                      </label>
                    ))}
                  </div>
                </div>

                {form.linkType === "invoice" ? (
                  <div className="form-group">
                    <label className="form-label">Invoice *</label>
                    <select className="form-input" value={form.invoiceId}
                      onChange={(e) => setForm((p) => ({ ...p, invoiceId: e.target.value }))}>
                      <option value="">Select invoice</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.quotation?.customer?.name} — {inv.quotation?.service} — {fmt(Number(inv.finalAmount))}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Quotation *</label>
                    <select className="form-input" value={form.quotationId}
                      onChange={(e) => setForm((p) => ({ ...p, quotationId: e.target.value }))}>
                      <option value="">Select quotation</option>
                      {quotations.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.customer?.name} — {q.service} — {fmt(Number(q.finalAmount))}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input type="number" className="form-input" value={form.amount} placeholder="Enter amount"
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.paidAt}
                    onChange={(e) => setForm((p) => ({ ...p, paidAt: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Payment"
        message="Delete this payment record? This cannot be undone."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
