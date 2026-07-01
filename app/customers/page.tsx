"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Customer } from "@/types";

const EMPTY: Partial<Customer> = {
  name: "", mobile: "", email: "", businessName: "", address: "", gstNumber: "", status: "Active",
};

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Customer>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search]);

  function openCreate() { setForm(EMPTY); setModal("create"); }
  function openEdit(c: Customer) { setForm(c); setModal("edit"); }
  function closeModal() { setModal(null); setForm(EMPTY); }

  const f = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    const isEdit = modal === "edit";
    const res = await fetch(isEdit ? `/api/customers/${form.id}` : "/api/customers", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error saving", "error"); return; }
    toast(isEdit ? "Customer updated" : "Customer created");
    closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    if (!res.ok) { toast("Failed to delete customer", "error"); return; }
    toast("Customer deleted"); load();
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Customers</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Customer</button>
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Search by name, mobile, GST…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : customers.length === 0 ? (
          <div className="empty-state">
            <h3>No customers yet</h3>
            <p>Add your first customer or convert a lead.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ New Customer</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Mobile</th><th>Business</th><th>GST Number</th><th>Email</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.mobile}</td>
                  <td>{c.businessName || "—"}</td>
                  <td><code style={{ fontSize: 12 }}>{c.gstNumber || "—"}</code></td>
                  <td>{c.email || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>Delete</button>
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
              <span className="modal-title">{modal === "create" ? "New Customer" : "Edit Customer"}</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {(["name", "mobile", "email", "businessName", "gstNumber", "status"] as (keyof Customer)[]).map((k) => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{k === "businessName" ? "Business Name" : k === "gstNumber" ? "GST Number" : k.charAt(0).toUpperCase() + k.slice(1)}</label>
                    <input className="form-input" value={(form[k] as string) ?? ""} onChange={f(k)} />
                  </div>
                ))}
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address ?? ""} onChange={f("address")} />
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

      <ConfirmDialog open={!!deleteTarget} title="Delete Customer"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  );
}
