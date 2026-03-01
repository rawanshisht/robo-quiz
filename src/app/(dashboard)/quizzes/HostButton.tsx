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
      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "Host"}
    </button>
  );
}
