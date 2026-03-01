"use client";

import type { QuestionEvent } from "@/types";

const OPTION_STYLES = [
  { bg: "bg-red-600 hover:bg-red-700 active:bg-red-800", label: "A" },
  { bg: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800", label: "B" },
  { bg: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700", label: "C" },
  { bg: "bg-green-600 hover:bg-green-700 active:bg-green-800", label: "D" },
];

interface Props {
  question: QuestionEvent;
  timeRemaining: number;
  answered: boolean;
  selectedOptionId: string | null;
  onAnswer: (optionId: string) => void;
}

export default function PlayerQuestion({
  question,
  timeRemaining,
  answered,
  selectedOptionId,
  onAnswer,
}: Props) {
  const timerPct = (timeRemaining / question.duration) * 100;
  const timerColor =
    timeRemaining > 10
      ? "bg-green-500"
      : timeRemaining > 5
        ? "bg-yellow-400"
        : "bg-red-500";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Timer bar */}
      <div className="h-2 bg-white/10">
        <div
          className={`h-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
        <span className="mb-2 text-xs text-gray-500 uppercase tracking-widest">
          Question {question.index + 1} of {question.total}
        </span>
        {question.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.image_url}
            alt=""
            className="mb-4 max-h-40 rounded-xl object-contain"
          />
        )}
        <h2 className="text-xl font-bold leading-snug">{question.text}</h2>
      </div>

      {/* Options */}
      <div className={`flex-1 grid gap-3 px-4 pb-6 content-start grid-cols-2`}>
        {question.options.map((opt, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length];
          const isSelected = selectedOptionId === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => !answered && onAnswer(opt.id)}
              disabled={answered}
              className={`
                rounded-2xl px-3 py-6 font-bold text-sm text-center transition-all
                ${style.bg}
                ${answered && !isSelected ? "opacity-30" : ""}
                ${isSelected ? "ring-4 ring-white scale-95" : ""}
                disabled:cursor-not-allowed
              `}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="px-4 pb-6 text-center text-gray-400 text-sm">
          Answer locked in — waiting for results…
        </div>
      )}
    </div>
  );
}
