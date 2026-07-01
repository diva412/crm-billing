"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",   icon: "⊞" },
  { href: "/leads",      label: "Leads",        icon: "◎" },
  { href: "/customers",  label: "Customers",    icon: "◉" },
  { href: "/followups",  label: "Follow-ups",   icon: "◷" },
  { href: "/quotations", label: "Quotations",   icon: "◈" },
  { href: "/invoices",   label: "Invoices",     icon: "◧" },
  { href: "/payments",   label: "Payments",     icon: "◆" },
  { href: "/projects",   label: "Projects",     icon: "◫" },
  { href: "/expenses",   label: "Expenses",     icon: "◔" },
  { href: "/reports",    label: "Reports",      icon: "◑" },
  { href: "/tax",        label: "Tax",          icon: "◎" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="sidebar">
      {/* Brand */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          CRM-BILLING
        </div>
        <div style={{ fontSize: 11, color: "var(--sidebar-text)", marginTop: 2 }}>
          Management System
        </div>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, padding: "12px 10px" }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 6,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                background: active ? "var(--sidebar-active)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ fontSize: 16, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #1e293b" }}>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: "100%", justifyContent: "flex-start", color: "var(--sidebar-text)", border: "none" }}
        >
          ⊗ &nbsp;Sign out
        </button>
      </div>
    </nav>
  );
}
