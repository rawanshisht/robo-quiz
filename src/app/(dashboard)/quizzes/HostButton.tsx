"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MiniGameType } from "@/types";

interface MiniGameOption {
  id: MiniGameType;
  label: string;
  description: string;
  icon: string;
}

const MINI_GAMES: MiniGameOption[] = [
  { id: "flying-math", label: "Flying Math", description: "Equations fall — type the answer to destroy them!", icon: "➕" },
  { id: "typing",      label: "Typing Game", description: "Words fall from the sky — type them fast to clear the screen!", icon: "⌨️" },
  { id: "robocody",    label: "RoboCody",    description: "Navigate a maze, collect pellets, answer questions!", icon: "🤖" },
];


export default function HostButton({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedMiniGame, setSelectedMiniGame] = useState<MiniGameType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleHost() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId, mode: "classic", mini_game_type: selectedMiniGame }),
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
                Add a Mini-Game Break?
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}>
                Every 3 questions, students play a short game. Optional — leave unselected for a standard quiz.
              </p>
            </div>

            {/* Mini-game options */}
            <div className="flex flex-col gap-2">
              {MINI_GAMES.map((mg) => {
                const isSelected = selectedMiniGame === mg.id;
                return (
                  <button
                    key={mg.id}
                    onClick={() => setSelectedMiniGame(selectedMiniGame === mg.id ? null : mg.id)}
                    className="flex items-start gap-3 rounded-xl border p-3 text-left transition-all"
                    style={{
                      borderColor: isSelected ? "var(--brand-primary)" : "var(--border)",
                      background: isSelected ? "rgba(0,220,222,0.07)" : "rgba(255,255,255,0.02)",
                      boxShadow: isSelected ? "0 0 0 1px var(--brand-primary)" : "none",
                    }}
                  >
                    <span className="text-2xl leading-none mt-0.5">{mg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-sm"
                        style={{ color: isSelected ? "var(--brand-primary)" : "var(--text)", fontFamily: "var(--font-syne)" }}
                      >
                        {mg.label}
                      </p>
                      <p className="text-xs mt-0.5 leading-tight" style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}>
                        {mg.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span
                        className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(0,220,222,0.15)", color: "var(--brand-primary)", fontFamily: "var(--font-fira)" }}
                      >
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
