"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";
import type { Expense, ExpenseCategory } from "@/types";

const CATEGORIES: ExpenseCategory[] = [
  "SALARY", "SOFTWARE", "DOMAIN", "SERVER",
  "MARKETING", "OFFICE", "TRAVEL", "OTHERS",
];

const fmt = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const EMPTY = {
  name: "", category: "OTHERS" as ExpenseCategory,
  amount: "", date: new Date().toISOString().slice(0, 10), notes: "",
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    if (monthFilter) params.set("month", monthFilter);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [categoryFilter, monthFilter]);

  function openCreate() { setForm(EMPTY); setEditId(""); setModal("create"); }
  function openEdit(e: Expense) {
    setForm({
      name: e.name,
      category: e.category,
      amount: String(e.amount),
      date: e.date.slice(0, 10),
      notes: e.notes ?? "",
    });
    setEditId(e.id);
    setModal("edit");
  }
  function closeModal() { setModal(null); setForm(EMPTY); setEditId(""); }

  async function handleSave() {
    setSaving(true);
    const isEdit = modal === "edit";
    const payload = { ...form, amount: parseFloat(form.amount) };
    const res = await fetch(isEdit ? `/api/expenses/${editId}` : "/api/expenses", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Error saving", "error"); return; }
    toast(isEdit ? "Expense updated" : "Expense added");
    closeModal(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false); setDeleteTarget(null);
    toast("Expense deleted"); load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Expenses</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Expense</button>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <select
          className="form-input"
          style={{ width: "auto" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="month"
          className="search-input"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{ width: "auto" }}
        />
        {(categoryFilter || monthFilter) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setCategoryFilter(""); setMonthFilter(""); }}>
            Clear
          </button>
        )}
      </div>

      {/* Total banner */}
      {expenses.length > 0 && (
        <div style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "14px 20px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            {monthFilter ? ` in ${monthFilter}` : ""}
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--danger)" }}>
            Total: {fmt(total)}
          </span>
        </div>
      )}

      <div className="card">
        {loading ? <LoadingSpinner /> : expenses.length === 0 ? (
          <div className="empty-state">
            <h3>No expenses recorded</h3>
            <p>Track your business expenses here.</p>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Expense</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.name}</strong></td>
                  <td>
                    <span className="badge badge-current" style={{ background: "#f1f5f9", color: "var(--text-secondary)" }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ color: "var(--danger)", fontWeight: 600 }}>{fmt(Number(e.amount))}</td>
                  <td>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{e.notes || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(e)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === "create" ? "Add Expense" : "Edit Expense"}</span>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Expense Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. AWS Server Bill"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  />
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
