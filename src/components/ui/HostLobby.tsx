"use client";

import { useState } from "react";
import type { LobbyUpdateEvent } from "@/types";

interface Props {
  code: string;
  quizTitle: string;
  questionCount: number;
  initialPlayers: string[];
  onStart: () => void;
  onEndEarly: () => void;
  liveUpdate?: LobbyUpdateEvent;
}

export default function HostLobby({
  code,
  quizTitle,
  questionCount,
  initialPlayers,
  onStart,
  onEndEarly,
}: Props) {
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    await onStart();
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-8" style={{ background: "var(--player-bg)" }}>
      <div className="w-full max-w-3xl">
        {/* Room code */}
        <div className="mb-10 text-center">
          <p
            className="text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            Room Code
          </p>
          <p
            className="text-[7rem] leading-none tracking-[0.15em]"
            style={{
              fontFamily: "var(--font-fira)",
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 32px rgba(0,220,222,0.3))",
            }}
          >
            {code}
          </p>
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            Students join at{" "}
            <span
              className="font-semibold"
              style={{ color: "var(--brand-primary)" }}
            >
              /play
            </span>
          </p>
        </div>

        {/* Quiz info */}
        <div
          className="mb-6 rounded-xl px-6 py-4 text-center border"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <p
            className="font-bold text-lg"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {quizTitle}
          </p>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            {questionCount} question{questionCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Player list */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
            >
              Players
            </h2>
            <span
              className="text-sm tabular-nums"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-fira)" }}
            >
              {initialPlayers.length} joined
            </span>
          </div>

          {initialPlayers.length === 0 ? (
            <div
              className="rounded-xl border border-dashed py-12 text-center text-sm"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-syne)",
              }}
            >
              Waiting for students to join…
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {initialPlayers.map((name) => (
                <li
                  key={name}
                  className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold border"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={starting || initialPlayers.length === 0}
          className="t-button uppercase w-full rounded-xl py-4 transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            color: "#09090f",
            fontFamily: "var(--font-syne)",
            boxShadow: initialPlayers.length > 0
              ? "0 4px 24px rgba(0,220,222,0.3)"
              : "none",
          }}
        >
          {starting ? "Starting…" : "Start Game"}
        </button>

        {initialPlayers.length === 0 && (
          <p
            className="mt-2 text-center text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            Need at least one player to start
          </p>
        )}

        <button
          onClick={onEndEarly}
          className="mt-4 w-full rounded-xl border py-3 text-sm font-semibold transition-all hover:bg-red-900/20 active:scale-[0.98]"
          style={{
            borderColor: "rgba(239,68,68,0.3)",
            color: "#ef4444",
            fontFamily: "var(--font-syne)",
          }}
        >
          Cancel &amp; End Session
        </button>
      </div>
    </div>
  );
}
