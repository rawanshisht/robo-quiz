"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MiniGameType } from "@/types";

type GameOption = "classic" | MiniGameType;

interface Option {
  id: GameOption;
  label: string;
  description: string;
  icon: string;
}

const OPTIONS: Option[] = [
  { id: "classic",     label: "Classic",      description: "Standard quiz — questions, answers, leaderboard.", icon: "📝" },
  { id: "flying-math", label: "Flying Math",  description: "Every 3 questions, equations fall — type the answer!", icon: "➕" },
  { id: "typing",      label: "Typing Game",  description: "Every 3 questions, words fall — type them to destroy!", icon: "⌨️" },
  { id: "robocody",    label: "RoboCody",     description: "Every 3 questions, navigate a maze and collect pellets!", icon: "👾" },
];

export default function HostButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<GameOption>("classic");
  const [loading, setLoading] = useState(false);

  async function handleHost() {
    setLoading(true);
    const miniGameType: MiniGameType | null = selected === "classic" ? null : selected;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId, mode: "classic", mini_game_type: miniGameType }),
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-1.5 text-sm font-black transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
          color: "#09090f",
          fontFamily: "var(--font-syne)",
        }}
      >
        Host
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(9,9,15,0.85)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 flex flex-col gap-5 overflow-y-auto"
            style={{ background: "#0f0f1a", borderColor: "var(--border)", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div>
              <p className="font-black text-lg" style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}>
                Choose Game Mode
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}>
                Classic is a plain quiz. The others add a mini-game every 3 questions.
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {OPTIONS.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className="flex items-start gap-3 rounded-xl border p-3 text-left transition-all"
                    style={{
                      borderColor: isSelected ? "var(--brand-primary)" : "var(--border)",
                      background: isSelected ? "rgba(0,220,222,0.07)" : "rgba(255,255,255,0.02)",
                      boxShadow: isSelected ? "0 0 0 1px var(--brand-primary)" : "none",
                    }}
                  >
                    <span className="text-2xl leading-none mt-0.5">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: isSelected ? "var(--brand-primary)" : "var(--text)", fontFamily: "var(--font-syne)" }}>
                        {opt.label}
                      </p>
                      <p className="text-xs mt-0.5 leading-tight" style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}>
                        {opt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(0,220,222,0.15)", color: "var(--brand-primary)", fontFamily: "var(--font-fira)" }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all hover:bg-white/5"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleHost}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-black transition-all hover:opacity-90 disabled:opacity-40 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
                  color: "#09090f",
                  fontFamily: "var(--font-syne)",
                }}
              >
                {loading ? "Starting…" : "Start Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
