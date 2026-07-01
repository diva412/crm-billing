"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [initials, setInitials] = useState("A");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const name: string = data.user.name ?? data.user.email ?? "Admin";
          setUserName(name);
          setInitials(
            name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header
      style={{
        height: 60,
        background: "#fff",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
        {title}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {userName && (
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
            {userName}
          </span>
        )}

        {/* Clickable avatar → profile page */}
        <Link
          href="/profile"
          title="My Profile"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            transition: "opacity 0.15s, box-shadow 0.15s",
            boxShadow: "0 2px 8px rgba(29,78,216,0.25)",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}