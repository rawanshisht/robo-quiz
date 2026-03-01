"use client";

import type { QuestionEvent } from "@/types";

const OPTION_COLORS = [
  "bg-red-600 hover:bg-red-700",
  "bg-blue-600 hover:bg-blue-700",
  "bg-yellow-500 hover:bg-yellow-600",
  "bg-green-600 hover:bg-green-700",
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
    timeRemaining > 10
      ? "text-white"
      : timeRemaining > 5
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-sm text-gray-400">
          Question {question.index + 1} of {question.total}
        </span>
        <span className={`text-4xl font-black tabular-nums ${timerColor}`}>
          {timeRemaining}
        </span>
        <span className="text-sm text-gray-400">
          {answerCount}/{totalPlayers} answered
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {question.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.image_url}
            alt=""
            className="mb-6 max-h-48 rounded-xl object-contain"
          />
        )}
        <h2 className="mb-8 max-w-2xl text-center text-2xl font-bold leading-snug">
          {question.text}
        </h2>

        {/* Options grid */}
        <div
          className={`grid w-full max-w-2xl gap-3 ${
            question.options.length === 2 ? "grid-cols-2" : "grid-cols-2"
          }`}
        >
          {question.options.map((opt, i) => (
            <div
              key={opt.id}
              className={`rounded-xl px-4 py-4 text-center font-semibold ${OPTION_COLORS[i % OPTION_COLORS.length]}`}
            >
              {opt.text}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onTogglePause}
          className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={onRevealNow}
          className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
        >
          Reveal Now
        </button>
        <button
          onClick={onEndEarly}
          className="rounded-xl border border-red-800/50 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-900/20 transition-colors"
        >
          End
        </button>
      </div>
    </div>
  );
}
