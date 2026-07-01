"use client";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Project, Customer, Quotation, ProjectStatus } from "@/types";

const STATUSES: ProjectStatus[] = ["CURRENT", "COMPLETED", "ON_HOLD", "CANCELLED"];

const EMPTY = {
  name: "", customerId: "", quotationId: "", startDate: "",
  deadline: "", status: "CURRENT" as ProjectStatus, notes: "",
};

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    const [pRes, cRes, qRes] = await Promise.all([
      fetch(`/api/projects${params}`), fetch("/api/customers"), fetch("/api/quotations"),
    ]);
    const [pData, cData, qData] = await Promise.all([pRes.json(), cRes.json(), qRes.json()]);
    setProjects(pData.projects ?? []);
    setCustomers(cData.customers ?? []);
    setQuotations(qData.quotations ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]);

  function openCreate() { setForm(EMPTY); setEditId(""); setModal("create"); }
  function openEdit(p: Project) {
    setForm({ name: p.name, customerId: p.customerId, quotationId: p.quotationId ?? "", startDate: p.startDate.slice(0,10), deadline: p.deadline?.slice(0,10) ?? "", status: p.status, notes: p.notes ?? "" });
    setEditId(p.id); setModal("edit");
  }
  function closeModal() { setModal(null); setForm(EMPTY); setEditId(""); }

  async function handleSave() {
    setSaving(true);
    const isEdit = modal === "edit";
    const payload = { ...form, quotationId: form.quotationId || undefined, deadline: form.deadline || undefined };
    const res = await fetch(isEdit ? `/api/projects/${editId}` : "/api/projects", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error saving", "error"); return; }
    toast("Project saved"); closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    toast("Project deleted"); load();
  }

  const filteredQuotations = form.customerId
    ? quotations.filter((q) => q.customerId === form.customerId)
    : quotations;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Projects</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
      </div>

      <div className="search-bar">
        <select className="form-input" style={{ width: "auto" }}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create a project linked to a customer and quotation.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Project</th><th>Customer</th><th>Quotation</th><th>Start</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.customer?.name ?? "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.quotation?.service ?? "—"}</td>
                  <td>{new Date(p.startDate).toLocaleDateString("en-IN")}</td>
                  <td>{p.deadline ? new Date(p.deadline).toLocaleDateString("en-IN") : "—"}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>Delete</button>
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
              <span className="modal-title">{modal === "create" ? "New Project" : "Edit Project"}</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Project Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select className="form-input" value={form.customerId}
                    onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value, quotationId: "" }))}>
                    <option value="">Select customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Related Quotation</label>
                  <select className="form-input" value={form.quotationId}
                    onChange={(e) => setForm((p) => ({ ...p, quotationId: e.target.value }))}>
                    <option value="">None</option>
                    {filteredQuotations.map((q) => <option key={q.id} value={q.id}>{q.service}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={form.deadline}
                    onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))}>
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

      <ConfirmDialog open={!!deleteTarget} title="Delete Project"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
