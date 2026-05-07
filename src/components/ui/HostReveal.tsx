"use client";

import { useEffect, useRef, useState } from "react";
import type { RevealEvent, QuestionEvent } from "@/types";
import type { ReactNode } from "react";

interface Props {
  reveal: RevealEvent;
  question: QuestionEvent;
  isPaused: boolean;
  allAnswered?: boolean;
  onNext: () => void;
  onTogglePause: () => void;
  onEndEarly: () => void;
  modeWidget?: ReactNode;
}

export default function HostReveal({
  reveal,
  question,
  isPaused,
  allAnswered = false,
  onNext,
  onTogglePause,
  onEndEarly,
  modeWidget,
}: Props) {
  const isLastQuestion = question.index + 1 >= question.total;
  const autoNextSecs = allAnswered ? 3 : 8;
  const [countdown, setCountdown] = useState(autoNextSecs);
  const calledRef = useRef(false);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  useEffect(() => {
    if (isPaused) return;
    if (countdown <= 0) {
      if (!calledRef.current) {
        calledRef.current = true;
        onNextRef.current();
      }
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, isPaused]);

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "var(--player-bg)" }}>
      {/* Top bar */}
      <div
        className="px-6 py-4 border-b text-center"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
        >
          Q {question.index + 1} / {question.total} — Results
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto">
        {/* Correct answer */}
        <div className="mb-8 w-full max-w-2xl">
          <p
            className="mb-2 text-xs uppercase tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            Correct Answer
          </p>
          <div
            className="rounded-xl px-6 py-4 text-center text-lg font-bold border-2"
            style={{
              background: "rgba(0,220,222,0.1)",
              borderColor: "var(--brand-primary)",
              fontFamily: "var(--font-syne)",
              boxShadow: "0 0 24px rgba(0,220,222,0.15)",
            }}
          >
            {question.options.find((o) => o.id === reveal.correct_option_id)
              ?.text ?? "—"}
          </div>
        </div>

        {/* Mode widget */}
        {modeWidget && (
          <div className="mb-8 w-full max-w-2xl">
            {modeWidget}
          </div>
        )}

        {/* Leaderboard */}
        <div className="w-full max-w-2xl">
          <p
            className="mb-3 text-xs uppercase tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            Leaderboard
          </p>
          <ol className="flex flex-col gap-2">
            {reveal.leaderboard.map((entry, i) => {
              const medalColor =
                i === 0
                  ? "var(--brand-primary)"
                  : i === 1
                    ? "#d1d5db"
                    : i === 2
                      ? "var(--brand-tertiary)"
                      : "#374151";
              return (
                <li
                  key={entry.nickname}
                  className="flex items-center justify-between rounded-xl px-5 py-3 border"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-black tabular-nums w-6 text-center"
                      style={{
                        fontFamily: "var(--font-bebas)",
                        color: medalColor,
                        fontSize: "1.1rem",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="font-semibold text-sm"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {entry.nickname}
                    </span>
                  </div>
                  <span
                    className="font-black tabular-nums text-sm"
                    style={{
                      fontFamily: "var(--font-fira)",
                      color: "var(--brand-tertiary)",
                    }}
                  >
                    {entry.score.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="px-6 pb-6 flex gap-3 border-t pt-4"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={onTogglePause}
          className="rounded-xl border px-5 py-4 text-sm font-semibold transition-all hover:bg-white/5 active:scale-95"
          style={{
            borderColor: "var(--border)",
            color: isPaused ? "var(--brand-primary)" : "var(--text-muted)",
            fontFamily: "var(--font-syne)",
          }}
        >
          {isPaused ? "▶" : "⏸"}
        </button>
        <button
          onClick={() => { calledRef.current = true; onNext(); }}
          className="t-button uppercase flex-1 rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            color: "#09090f",
            fontFamily: "var(--font-syne)",
          }}
        >
          {isLastQuestion ? `End Game (${countdown})` : `Next Question (${countdown})`}
        </button>
        <button
          onClick={onEndEarly}
          className="rounded-xl border px-5 py-4 text-sm font-semibold text-red-500 transition-all hover:bg-red-900/20 active:scale-95"
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
