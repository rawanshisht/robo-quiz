"use client";

import type { RevealEvent } from "@/types";

interface Props {
  reveal: RevealEvent;
  selectedOptionId: string | null;
  pointsEarned: number;
  nickname: string;
}

export default function PlayerReveal({
  reveal,
  selectedOptionId,
  pointsEarned,
  nickname,
}: Props) {
  const wasCorrect =
    selectedOptionId !== null &&
    selectedOptionId === reveal.correct_option_id;

  const rank =
    reveal.leaderboard.findIndex((e) => e.nickname === nickname) + 1;
  const totalPlayers = reveal.leaderboard.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      {/* Correct / Wrong */}
      <div
        className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl ${
          wasCorrect
            ? "bg-green-500/20 border-2 border-green-500"
            : selectedOptionId === null
              ? "bg-gray-500/20 border-2 border-gray-500"
              : "bg-red-500/20 border-2 border-red-500"
        }`}
      >
        {wasCorrect ? "✓" : selectedOptionId === null ? "—" : "✗"}
      </div>

      <h2 className="text-2xl font-black mb-1">
        {wasCorrect
          ? "Correct!"
          : selectedOptionId === null
            ? "Time's up!"
            : "Wrong answer"}
      </h2>

      {pointsEarned > 0 && (
        <p className="text-yellow-400 font-bold text-lg mb-6">
          +{pointsEarned.toLocaleString()} pts
        </p>
      )}
      {pointsEarned === 0 && wasCorrect && (
        <p className="text-gray-400 text-sm mb-6">No time left for points</p>
      )}
      {!wasCorrect && <div className="mb-6" />}

      {/* Rank */}
      {rank > 0 && (
        <div className="mb-6 rounded-xl bg-white/5 border border-white/10 px-8 py-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
            Your rank
          </p>
          <p className="text-3xl font-black">
            #{rank}{" "}
            <span className="text-base font-normal text-gray-500">
              of {totalPlayers}
            </span>
          </p>
        </div>
      )}

      <p className="text-gray-600 text-sm">Waiting for the next question…</p>
    </div>
  );
}
