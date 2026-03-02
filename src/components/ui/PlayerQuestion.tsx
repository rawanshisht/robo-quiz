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
      ? "var(--brand-primary)"
      : timeRemaining > 5
        ? "var(--brand-tertiary)"
        : "var(--brand-secondary)";

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: "var(--player-bg)" }}
    >
      {/* Timer bar */}
      <div
        className="h-2 w-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full transition-all duration-1000 ease-linear rounded-r-full"
          style={{ width: `${timerPct}%`, background: timerColor }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
        >
          Q {question.index + 1}/{question.total}
        </span>

        {/* Countdown */}
        <span
          className="text-6xl leading-none tabular-nums transition-colors duration-500"
          style={{ fontFamily: "var(--font-bebas)", color: timerColor }}
        >
          {timeRemaining}
        </span>

        <span className="w-16" />
      </div>

      {/* Question */}
      <div className="flex flex-col items-center justify-center px-6 py-4 text-center flex-shrink-0">
        {question.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.image_url}
            alt=""
            className="mb-4 max-h-36 rounded-2xl object-contain"
          />
        )}
        <h2
          className="t-lead font-bold max-w-sm"
        >
          {question.text}
        </h2>
      </div>

      {/* Options */}
      <div className="flex-1 grid grid-cols-2 gap-3 px-4 pb-4 pt-2 content-end">
        {question.options.map((opt, i) => {
          const style = OPTION_STYLES[i % OPTION_STYLES.length];
          const isSelected = selectedOptionId === opt.id;
          const isDimmed = answered && !isSelected;

          return (
            <button
              key={opt.id}
              onClick={() => !answered && onAnswer(opt.id)}
              disabled={answered}
              className="rounded-3xl px-3 py-6 text-sm font-black text-center transition-all active:scale-95 disabled:cursor-not-allowed"
              style={{
                background: style.bg,
                color: style.color,
                opacity: isDimmed ? 0.2 : 1,
                outline: isSelected ? "3px solid white" : "none",
                outlineOffset: "3px",
                boxShadow: isSelected
                  ? `0 0 24px ${style.bg}88`
                  : isDimmed
                    ? "none"
                    : `0 4px 16px ${style.bg}44`,
                transform: isSelected ? "scale(1.03)" : "scale(1)",
                fontFamily: "var(--font-syne)",
              }}
            >
              <span
                className="block text-xs font-black mb-1.5 opacity-60"
                style={{ fontFamily: "var(--font-fira)" }}
              >
                {style.label}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Locked in state */}
      {answered && (
        <div className="px-4 pb-5 flex flex-col items-center gap-1">
          <div
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full"
            style={{
              background: "rgba(0,220,222,0.12)",
              color: "var(--brand-primary)",
              fontFamily: "var(--font-syne)",
              border: "1px solid rgba(0,220,222,0.25)",
            }}
          >
            ✓ Locked in — waiting for results…
          </div>
        </div>
      )}
    </div>
  );
}
