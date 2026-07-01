"use client";

import { useState } from "react";

export default function AvatarUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    const res = await fetch("/api/upload/avatar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.avatar) {
      onUploaded(data.avatar);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <input type="file" accept="image/*" onChange={upload} />

      {loading && (
        <p style={{ fontSize: 12, color: "gray" }}>
          Uploading...
        </p>
      )}
    </div>
  );
}