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
  // Accept live updates from parent (GameHost manages Pusher)
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
    // Don't reset — GameHost will switch phase
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-3xl">
        {/* Room code */}
        <div className="mb-8 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Room Code
          </p>
          <p className="text-7xl font-black tracking-widest font-mono">{code}</p>
          <p className="mt-3 text-gray-400 text-sm">
            Students join at{" "}
            <span className="text-white font-medium">/play</span>
          </p>
        </div>

        {/* Quiz info */}
        <div className="mb-6 rounded-xl bg-white/5 border border-white/10 px-6 py-4 text-center">
          <p className="font-semibold text-lg">{quizTitle}</p>
          <p className="text-sm text-gray-400">
            {questionCount} question{questionCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Player list */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-300">Players in lobby</h2>
            <span className="text-sm text-gray-500">
              {initialPlayers.length} joined
            </span>
          </div>

          {initialPlayers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 py-12 text-center text-gray-600">
              Waiting for students to join…
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {initialPlayers.map((name) => (
                <li
                  key={name}
                  className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-center font-medium text-sm"
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
          className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {starting ? "Starting…" : "Start Game"}
        </button>
        {initialPlayers.length === 0 && (
          <p className="mt-2 text-center text-xs text-gray-600">
            Need at least one player to start
          </p>
        )}

        <button
          onClick={onEndEarly}
          className="mt-4 w-full rounded-xl border border-red-800/50 py-3 text-sm font-semibold text-red-500 hover:bg-red-900/20 transition-colors"
        >
          Cancel &amp; End Session
        </button>
      </div>
    </div>
  );
}
