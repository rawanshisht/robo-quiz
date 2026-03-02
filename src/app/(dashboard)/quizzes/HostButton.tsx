"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HostButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHost() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId }),
      });
      if (!res.ok) throw new Error();
      const { room_code } = await res.json();
      router.push(`/host/${room_code}`);
    } catch {
      alert("Failed to start session. Try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleHost}
      disabled={loading}
      className="rounded-lg px-3 py-1.5 text-sm font-black transition-all hover:opacity-90 disabled:opacity-40 active:scale-95"
      style={{
        background:
          "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
        color: "#09090f",
        fontFamily: "var(--font-syne)",
      }}
    >
      {loading ? "…" : "Host"}
    </button>
  );
}
