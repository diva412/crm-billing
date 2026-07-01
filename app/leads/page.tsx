"use client";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Lead, LeadStatus } from "@/types";

const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"];

const EMPTY: Partial<Lead> = {
  name: "", mobile: "", email: "", businessName: "",
  interestedService: "", source: "", status: "NEW", notes: "",
};

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Lead>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, statusFilter]);

  function openCreate() { setForm(EMPTY); setModal("create"); }
  function openEdit(l: Lead) { setForm(l); setModal("edit"); }
  function closeModal() { setModal(null); setForm(EMPTY); }

  async function handleSave() {
    setSaving(true);
    const isEdit = modal === "edit";
    const url = isEdit ? `/api/leads/${form.id}` : "/api/leads";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error saving lead", "error"); return; }
    toast(isEdit ? "Lead updated" : "Lead created");
    closeModal();
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/leads/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) { toast("Failed to delete lead", "error"); return; }
    toast("Lead deleted");
    load();
  }

  const f = (k: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Leads</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Lead</button>
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Search by name, mobile, business…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-input" style={{ width: "auto" }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : leads.length === 0 ? (
          <div className="empty-state">
            <h3>No leads yet</h3>
            <p>Create your first lead to get started.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ New Lead</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Mobile</th><th>Business</th>
                <th>Service</th><th>Status</th><th>Source</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td>{l.mobile}</td>
                  <td>{l.businessName || "—"}</td>
                  <td>{l.interestedService || "—"}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>{l.source || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(l)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(l)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === "create" ? "New Lead" : "Edit Lead"}</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name ?? ""} onChange={f("name")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input className="form-input" value={form.mobile ?? ""} onChange={f("mobile")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email ?? ""} onChange={f("email")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input className="form-input" value={form.businessName ?? ""} onChange={f("businessName")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Interested Service</label>
                  <input className="form-input" value={form.interestedService ?? ""} onChange={f("interestedService")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <input className="form-input" value={form.source ?? ""} onChange={f("source")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status ?? "NEW"} onChange={f("status")}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Lead"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
