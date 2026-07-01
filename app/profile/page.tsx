"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/ToastProvider";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  designation?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      setName(data.user.name ?? "");
      setPhone(data.user.phone ?? "");
      setDesignation(data.user.designation ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, designation }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast(data.error ?? "Failed to update", "error"); return; }
    toast("Profile updated successfully");
    load();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match", "error"); return;
    }
    if (newPassword.length < 8) {
      toast("New password must be at least 8 characters", "error"); return;
    }
    setChangingPw(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setChangingPw(false);
    if (!res.ok) { toast(data.error ?? "Failed to change password", "error"); return; }
    toast("Password changed successfully");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  }

  if (loading) return <LoadingSpinner />;

  const initials = (user?.name ?? user?.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Avatar + name header */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "28px 32px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            {user?.name ?? "Admin"}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 2 }}>
            {user?.designation ?? "Administrator"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {user?.email}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "—"}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Edit Profile
        </div>
        <form onSubmit={handleSaveProfile} style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={user?.email ?? ""}
                disabled
                style={{ background: "#f8fafc", color: "var(--text-secondary)", cursor: "not-allowed" }}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Email cannot be changed</span>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                className="form-input"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Sales Manager, CTO"
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            fontWeight: 700,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>Change Password</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
            Must be at least 8 characters
          </span>
        </div>
        <form onSubmit={handleChangePassword} style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 16, maxWidth: 400 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 14,
                    color: "var(--text-muted)",
                  }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{
                  borderColor: confirmPassword && newPassword !== confirmPassword ? "var(--danger)" : undefined,
                }}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="form-error">Passwords do not match</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={changingPw || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              {changingPw ? "Changing…" : "Change Password"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}