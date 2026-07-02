"use client";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { FollowUp, Lead, Customer } from "@/types";

const TYPES = ["CALL", "WHATSAPP", "EMAIL", "MEETING"] as const;
const STATUSES = ["PENDING", "COMPLETED", "MISSED"] as const;

const EMPTY = {
  leadId: "", customerId: "", date: "", time: "",
  type: "CALL" as const, notes: "", status: "PENDING" as const,
};

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [linkTo, setLinkTo] = useState<"lead" | "customer">("customer");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const [fuRes, leadsRes, custRes] = await Promise.all([
      fetch(`/api/followups?${params}`),
      fetch("/api/leads"),
      fetch("/api/customers"),
    ]);
    const [fuData, leadsData, custData] = await Promise.all([fuRes.json(), leadsRes.json(), custRes.json()]);
    setFollowUps(fuData.followUps ?? []);
    setLeads(leadsData.leads ?? []);
    setCustomers(custData.customers ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]);

  function openCreate() { setForm(EMPTY); setEditId(""); setModal("create"); }
  function openEdit(fu: FollowUp) {
    setForm({ leadId: fu.leadId ?? "", customerId: fu.customerId ?? "", date: fu.date.slice(0, 10), time: fu.time, type: fu.type as "CALL", notes: fu.notes ?? "", status: fu.status as "PENDING" });
    setLinkTo(fu.customerId ? "customer" : "lead");
    setEditId(fu.id);
    setModal("edit");
  }
  function closeModal() { setModal(null); setForm(EMPTY); setEditId(""); }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      leadId: linkTo === "lead" ? form.leadId || undefined : undefined,
      customerId: linkTo === "customer" ? form.customerId || undefined : undefined,
    };
    const isEdit = modal === "edit";
    const res = await fetch(isEdit ? `/api/followups/${editId}` : "/api/followups", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error saving", "error"); return; }
    toast("Follow-up saved");
    closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/followups/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    toast("Follow-up deleted"); load();
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Follow-ups</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Follow-up</button>
      </div>

      <div className="search-bar">
        <select className="form-input" style={{ width: "auto" }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : followUps.length === 0 ? (
          <div className="empty-state">
            <h3>No follow-ups scheduled</h3>
            <p>Schedule a follow-up with a lead or customer.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ New Follow-up</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>With</th><th>Type</th><th>Date</th><th>Time</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {followUps.map((f) => (
                <tr key={f.id}>
                  <td><strong>{f.customer?.name ?? f.lead?.name ?? "—"}</strong></td>
                  <td><span className="badge badge-pending" style={{ background: "#f0fdf4", color: "#15803d" }}>{f.type}</span></td>
                  <td>{new Date(f.date).toLocaleDateString("en-IN")}</td>
                  <td>{f.time}</td>
                  <td><StatusBadge status={f.status} /></td>
                  <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.notes || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(f)}>Delete</button>
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
              <span className="modal-title">{modal === "create" ? "New Follow-up" : "Edit Follow-up"}</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Link to</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["customer", "lead"] as const).map((t) => (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input type="radio" checked={linkTo === t} onChange={() => setLinkTo(t)} />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                {linkTo === "customer" ? (
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Customer *</label>
                    <select className="form-input" value={form.customerId}
                      onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))}>
                      <option value="">Select customer</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Lead *</label>
                    <select className="form-input" value={form.leadId}
                      onChange={(e) => setForm((p) => ({ ...p, leadId: e.target.value }))}>
                      <option value="">Select lead</option>
                      {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input type="time" className="form-input" value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as typeof form.type }))}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as typeof form.status }))}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
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

      <ConfirmDialog open={!!deleteTarget} title="Delete Follow-up"
        message="Delete this follow-up? This cannot be undone."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
