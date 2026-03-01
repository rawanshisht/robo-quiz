"use client";

import type { RevealEvent, QuestionEvent } from "@/types";

interface Props {
  reveal: RevealEvent;
  question: QuestionEvent;
  isPaused: boolean;
  onNext: () => void;
  onTogglePause: () => void;
  onEndEarly: () => void;
}

export default function HostReveal({
  reveal,
  question,
  isPaused,
  onNext,
  onTogglePause,
  onEndEarly,
}: Props) {
  const isLastQuestion = question.index + 1 >= question.total;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-white/10 text-center">
        <span className="text-sm text-gray-400">
          Question {question.index + 1} of {question.total}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 overflow-y-auto">
        {/* Correct answer */}
        <div className="mb-8 w-full max-w-2xl">
          <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
            Correct Answer
          </p>
          <div className="rounded-xl bg-green-600 px-6 py-4 text-center text-lg font-bold">
            {question.options.find((o) => o.id === reveal.correct_option_id)
              ?.text ?? "—"}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">
            Leaderboard
          </p>
          <ol className="flex flex-col gap-2">
            {reveal.leaderboard.map((entry, i) => (
              <li
                key={entry.nickname}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-black tabular-nums w-6 text-center ${
                      i === 0
                        ? "text-yellow-400"
                        : i === 1
                          ? "text-gray-300"
                          : i === 2
                            ? "text-amber-600"
                            : "text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold">{entry.nickname}</span>
                </div>
                <span className="font-black tabular-nums text-white">
                  {entry.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-6 flex gap-3">
        <button
          onClick={onTogglePause}
          className="rounded-xl border border-white/20 px-4 py-4 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-blue-600 py-4 text-lg font-bold hover:bg-blue-700 transition-colors"
        >
          {isLastQuestion ? "End Game" : "Next Question →"}
        </button>
        <button
          onClick={onEndEarly}
          className="rounded-xl border border-red-800/50 px-4 py-4 text-sm font-semibold text-red-500 hover:bg-red-900/20 transition-colors"
        >
          End
        </button>
      </div>
    </div>
  );
}
