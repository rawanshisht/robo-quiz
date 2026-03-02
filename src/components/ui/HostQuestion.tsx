"use client";

import type { QuestionEvent } from "@/types";

const OPTION_STYLES = [
  { bg: "#00dcde", color: "#09090f", label: "A" },
  { bg: "#ff00bf", color: "#09090f", label: "B" },
  { bg: "#ff9752", color: "#09090f", label: "C" },
  { bg: "#a855f7", color: "#ffffff", label: "D" },
];

interface Props {
  question: QuestionEvent;
  timeRemaining: number;
  answerCount: number;
  totalPlayers: number;
  isPaused: boolean;
  onRevealNow: () => void;
  onTogglePause: () => void;
  onEndEarly: () => void;
}

export default function HostQuestion({
  question,
  timeRemaining,
  answerCount,
  totalPlayers,
  isPaused,
  onRevealNow,
  onTogglePause,
  onEndEarly,
}: Props) {
  const timerColor =
    timeRemaining > 10 ? "#22c55e" : timeRemaining > 5 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: "var(--player-bg)", color: "white" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
        >
          Q {question.index + 1} / {question.total}
        </span>

        {/* Countdown */}
        <span
          className="text-6xl leading-none tabular-nums transition-colors duration-500"
          style={{
            fontFamily: "var(--font-bebas)",
            color: isPaused ? "#4a4a5a" : timerColor,
          }}
        >
          {timeRemaining}
        </span>

        <span
          className="text-xs tabular-nums"
          style={{ color: "#4a4a5a", fontFamily: "var(--font-fira)" }}
        >
          {answerCount}/{totalPlayers}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
        {question.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.image_url}
            alt=""
            className="mb-6 max-h-48 rounded-xl object-contain"
          />
        )}
        <h2
          className="t-h2 mb-8 max-w-2xl text-center"
        >
          {question.text}
        </h2>

        {/* Options grid */}
        <div className="grid grid-cols-2 w-full max-w-2xl gap-3">
          {question.options.map((opt, i) => (
            <div
              key={opt.id}
              className="rounded-xl px-4 py-5 text-center font-semibold text-sm"
              style={{
                background: OPTION_STYLES[i % OPTION_STYLES.length].bg,
                color: OPTION_STYLES[i % OPTION_STYLES.length].color,
                fontFamily: "var(--font-syne)",
                opacity: isPaused ? 0.5 : 1,
              }}
            >
              <span
                className="block text-xs font-black mb-1 opacity-60"
                style={{ fontFamily: "var(--font-fira)" }}
              >
                {OPTION_STYLES[i % OPTION_STYLES.length].label}
              </span>
              {opt.text}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="px-6 pb-6 flex gap-3 border-t pt-4"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={onTogglePause}
          className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95"
          style={{
            borderColor: "rgba(255,255,255,0.15)",
            color: isPaused ? "var(--brand-primary)" : "#9ca3af",
            fontFamily: "var(--font-syne)",
          }}
        >
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          onClick={onRevealNow}
          className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95"
          style={{
            borderColor: "rgba(255,255,255,0.15)",
            color: "#9ca3af",
            fontFamily: "var(--font-syne)",
          }}
        >
          Reveal Now
        </button>
        <button
          onClick={onEndEarly}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-red-500 transition-all hover:bg-red-900/20 active:scale-95"
          style={{
            borderColor: "rgba(239,68,68,0.25)",
            fontFamily: "var(--font-syne)",
          }}
        >
          End
        </button>
      </div>
    </div>
  );
}
