"use client";

import type { RevealEvent } from "@/types";
import type { ReactNode } from "react";

interface Props {
  reveal: RevealEvent;
  selectedOptionId: string | null;
  pointsEarned: number;
  nickname: string;
  modeWidget?: ReactNode;
}

export default function PlayerReveal({
  reveal,
  selectedOptionId,
  pointsEarned,
  nickname,
  modeWidget,
}: Props) {
  const wasCorrect =
    selectedOptionId !== null &&
    selectedOptionId === reveal.correct_option_id;
  const timedOut = selectedOptionId === null;

  const rank =
    reveal.leaderboard.findIndex((e) => e.nickname === nickname) + 1;
  const totalPlayers = reveal.leaderboard.length;

  const resultColor = wasCorrect
    ? "var(--brand-primary)"
    : timedOut
      ? "var(--brand-tertiary)"
      : "var(--brand-secondary)";

  const resultEmoji = wasCorrect ? "🎉" : timedOut ? "⏱" : "😅";
  const resultLabel = wasCorrect
    ? "Correct!"
    : timedOut
      ? "Time's Up!"
      : "Wrong Answer";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-white"
      style={{ background: "var(--player-bg)" }}
    >
      {/* Result icon */}
      <div
        className="mb-5 w-24 h-24 rounded-full flex items-center justify-center text-4xl border-2 transition-all"
        style={{
          borderColor: resultColor,
          background: `color-mix(in srgb, ${wasCorrect ? "#00dcde" : timedOut ? "#ff9752" : "#ff00bf"} 12%, transparent)`,
          boxShadow: `0 0 32px color-mix(in srgb, ${wasCorrect ? "#00dcde" : timedOut ? "#ff9752" : "#ff00bf"} 35%, transparent)`,
          animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {resultEmoji}
      </div>

      <h2
        className="t-heading mb-2"
        style={{ color: resultColor }}
      >
        {resultLabel}
      </h2>

      {/* Points */}
      {pointsEarned > 0 && (
        <p
          className="text-4xl font-black mb-6"
          style={{
            fontFamily: "var(--font-bebas)",
            color: "var(--brand-tertiary)",
            letterSpacing: "0.05em",
            textShadow: "0 0 20px rgba(255,151,82,0.5)",
          }}
        >
          +{pointsEarned.toLocaleString()} pts
        </p>
      )}
      {pointsEarned === 0 && wasCorrect && (
        <p
          className="text-sm mb-6"
          style={{ color: "#6b7280", fontFamily: "var(--font-syne)" }}
        >
          No time left for points
        </p>
      )}
      {!wasCorrect && !timedOut && <div className="mb-6" />}
      {timedOut && <div className="mb-6" />}

      {/* Rank card */}
      {rank > 0 && (
        <div
          className="mb-6 rounded-2xl px-10 py-5 text-center border"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.09)",
          }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
          >
            Your Rank
          </p>
          <p
            className="leading-none"
            style={{ fontFamily: "var(--font-bebas)", fontSize: "3rem" }}
          >
            <span style={{ color: "var(--brand-primary)" }}>#{rank}</span>
            {"  "}
            <span
              style={{
                fontSize: "1.1rem",
                color: "#4a4a5a",
                fontFamily: "var(--font-syne)",
              }}
            >
              of {totalPlayers}
            </span>
          </p>
        </div>
      )}

      {/* Mode widget */}
      {modeWidget && (
        <div className="w-full max-w-sm mb-4">
          {modeWidget}
        </div>
      )}

      {/* Waiting indicator */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: "var(--brand-primary)",
              animation: `pulse-dot 1.4s ease-in-out ${i * 0.22}s infinite`,
            }}
          />
        ))}
      </div>
      <p
        className="mt-2 text-xs uppercase tracking-widest"
        style={{ color: "#374151", fontFamily: "var(--font-syne)" }}
      >
        Next question coming up…
      </p>
    </div>
  );
}
