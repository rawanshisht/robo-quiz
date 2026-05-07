"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteQuizButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete quiz. Please try again.");
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
        >
          Delete?
        </span>
        <button
          onClick={handleDelete}
          className="rounded-lg px-3 py-1.5 text-sm font-bold text-white hover:opacity-90 transition-all active:scale-95"
          style={{ background: "#dc2626" }}
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all hover:bg-white/5 active:scale-95"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-syne)",
          }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all hover:bg-red-900/20 active:scale-95"
      style={{
        borderColor: "rgba(239,68,68,0.3)",
        color: "#ef4444",
        fontFamily: "var(--font-syne)",
      }}
    >
      Delete
    </button>
  );
}
