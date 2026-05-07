"use client";

import { useEffect, useRef, useState } from "react";

const GAME_LABELS: Record<string, string> = {
  "flying-math": "Flying Math",
  typing: "Typing Game",
  robocody: "RoboCody",
};

const GAME_DESCRIPTIONS: Record<string, string> = {
  "flying-math": "Students are destroying falling equations by typing the correct answers!",
  typing: "Students are typing falling words as fast as they can!",
  robocody: "Students are navigating a maze, collecting pellets, and answering questions!",
};

const GAME_ICONS: Record<string, string> = {
  "flying-math": "➕",
  typing: "⌨️",
  robocody: "🤖",
};

const AUTO_CONTINUE_SECS = 45;

interface Props {
  gameType: string;
  level: number;
  code: string;
  onContinue: () => void;
  isContinuing: boolean;
}

export default function HostMiniGameView({ gameType, level, onContinue, isContinuing }: Props) {
  const [countdown, setCountdown] = useState(AUTO_CONTINUE_SECS);
  const calledRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  useEffect(() => { onContinueRef.current = onContinue; }, [onContinue]);

  useEffect(() => {
    if (countdown <= 0) {
      if (!calledRef.current) {
        calledRef.current = true;
        onContinueRef.current();
      }
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-white"
      style={{ background: "var(--player-bg)" }}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* Animated icon */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: "rgba(0,220,222,0.08)",
            border: "2px solid rgba(0,220,222,0.3)",
            boxShadow: "0 0 40px rgba(0,220,222,0.15)",
            animation: "ghost-pulse 2s ease-in-out infinite",
          }}
        >
          {GAME_ICONS[gameType] ?? "🎮"}
        </div>

        {/* Title */}
        <div className="text-center">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{ fontFamily: "var(--font-fira)", color: "var(--text-muted)" }}
          >
            Game Break · Level {level}
          </p>
          <p
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: 52,
              lineHeight: 1,
              background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {GAME_LABELS[gameType] ?? "Mini Game"}
          </p>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ fontFamily: "var(--font-syne)", color: "var(--text-muted)", maxWidth: 320 }}
          >
            {GAME_DESCRIPTIONS[gameType] ?? "Students are playing a mini-game."}
          </p>
        </div>

        {/* Countdown ring */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" width="80" height="80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="var(--brand-primary)" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdown / AUTO_CONTINUE_SECS)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span style={{ fontFamily: "var(--font-bebas)", fontSize: 28, color: "var(--brand-primary)", lineHeight: 1 }}>
            {countdown}
          </span>
        </div>

        <p
          className="text-xs text-center -mt-2"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text-muted)" }}
        >
          Quiz resumes automatically. Game scores count toward the leaderboard.
        </p>

        {/* Early continue button */}
        <button
          onClick={() => { calledRef.current = true; onContinue(); }}
          disabled={isContinuing}
          className="w-full rounded-xl py-3 font-semibold uppercase transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-syne)",
            fontSize: 13,
          }}
        >
          {isContinuing ? "Loading…" : "Continue Now →"}
        </button>
      </div>
    </div>
  );
}
