"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Quotation, Customer } from "@/types";

const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

function gstPreview(finalAmount: number, gstPercent: number) {
  if (!finalAmount || !gstPercent) return null;
  const subtotal = finalAmount / (1 + gstPercent / 100);
  const gstAmount = finalAmount - subtotal;
  return { subtotal: Math.round(subtotal * 100) / 100, gstAmount: Math.round(gstAmount * 100) / 100 };
}

const EMPTY = { customerId: "", service: "", description: "", finalAmount: "", gstPercent: "18" };

export default function QuotationsPage() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [qRes, cRes] = await Promise.all([fetch("/api/quotations"), fetch("/api/customers")]);
    const [qData, cData] = await Promise.all([qRes.json(), cRes.json()]);
    setQuotations(qData.quotations ?? []);
    setCustomers(cData.customers ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setEditId(""); setModal("create"); }
  function openEdit(q: Quotation) {
    setForm({ customerId: q.customerId, service: q.service, description: q.description ?? "", finalAmount: String(q.finalAmount), gstPercent: String(q.gstPercent) });
    setEditId(q.id);
    setModal("edit");
  }
  function closeModal() { setModal(null); setForm(EMPTY); setEditId(""); }

  const preview = gstPreview(parseFloat(form.finalAmount), parseFloat(form.gstPercent));

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, finalAmount: parseFloat(form.finalAmount), gstPercent: parseFloat(form.gstPercent) };
    const isEdit = modal === "edit";
    const res = await fetch(isEdit ? `/api/quotations/${editId}` : "/api/quotations", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error saving", "error"); return; }
    toast("Quotation saved");
    closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/quotations/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(false); setDeleteTarget(null);
    if (!res.ok) { toast(data.error ?? "Failed to delete", "error"); return; }
    toast("Quotation deleted"); load();
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Quotations</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Quotation</button>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : quotations.length === 0 ? (
          <div className="empty-state">
            <h3>No quotations yet</h3>
            <p>Create a quotation for a customer.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ New Quotation</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Customer</th><th>Service</th><th>Subtotal</th><th>GST</th><th>Final Amount</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td><strong>{q.customer?.name ?? "—"}</strong></td>
                  <td>{q.service}</td>
                  <td>{fmt(Number(q.subtotal))}</td>
                  <td>{fmt(Number(q.gstAmount))} <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({q.gstPercent}%)</span></td>
                  <td><strong>{fmt(Number(q.finalAmount))}</strong></td>
                  <td>{new Date(q.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(q)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(q)}>Delete</button>
                    </div>
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
              <span className="modal-title">{modal === "create" ? "New Quotation" : "Edit Quotation"}</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Customer *</label>
                  <select className="form-input" value={form.customerId}
                    onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))}>
                    <option value="">Select customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Service *</label>
                  <input className="form-input" value={form.service}
                    onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Final Amount (incl. GST) *</label>
                  <input type="number" className="form-input" value={form.finalAmount} placeholder="e.g. 20000"
                    onChange={(e) => setForm((p) => ({ ...p, finalAmount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST % *</label>
                  <input type="number" className="form-input" value={form.gstPercent} placeholder="18"
                    onChange={(e) => setForm((p) => ({ ...p, gstPercent: e.target.value }))} />
                </div>
              </div>

              {/* Live GST breakdown preview */}
              {preview && (
                <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                    Auto-calculated breakdown
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Subtotal</div>
                      <div style={{ fontWeight: 700 }}>{fmt(preview.subtotal)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>GST ({form.gstPercent}%)</div>
                      <div style={{ fontWeight: 700 }}>{fmt(preview.gstAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Final Amount</div>
                      <div style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(parseFloat(form.finalAmount))}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete Quotation"
        message={`Delete this quotation? This will fail if invoices exist against it.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
