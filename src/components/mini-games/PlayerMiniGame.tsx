"use client";

import { useState } from "react";
import FlyingMath from "./FlyingMath";
import TypingGame from "./TypingGame";
import RoboCody from "./RoboCody";
import type { GameBreakStartEvent, MiniGameResult } from "@/types";

const GAME_LABELS: Record<string, string> = {
  "flying-math": "Flying Math",
  typing: "Typing Game",
  robocody: "RoboCody",
};

const GAME_ICONS: Record<string, string> = {
  "flying-math": "➕",
  typing: "⌨️",
  robocody: "🤖",
};

interface Props {
  code: string;
  playerId: string;
  breakData: GameBreakStartEvent;
}

export default function PlayerMiniGame({ code, playerId, breakData }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  async function handleComplete(result: MiniGameResult) {
    setFinalScore(result.finalScore);
    setSubmitted(true);

    try {
      await fetch(`/api/sessions/${code}/game-break/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, points: result.finalScore }),
      });
    } catch {
      // ignore
    }

    // Trigger the next question immediately — idempotent, safe to call from every player
    try {
      await fetch(`/api/sessions/${code}/game-break/end`, { method: "POST" });
    } catch {
      // ignore
    }
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-white"
        style={{ background: "var(--player-bg)" }}
      >
        <div className="text-6xl mb-4" style={{ lineHeight: 1 }}>
          {GAME_ICONS[breakData.gameType]}
        </div>
        <p
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: 44,
            lineHeight: 1,
            background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Nice Work!
        </p>
        <p
          className="mt-2"
          style={{ fontFamily: "var(--font-fira)", fontSize: 28, color: "var(--brand-tertiary)", fontWeight: 700 }}
        >
          +{finalScore} pts
        </p>
        <p
          className="mt-4 text-sm"
          style={{ fontFamily: "var(--font-syne)", color: "var(--text-muted)" }}
        >
          Waiting for the host to continue…
        </p>
        <div
          className="mt-3 w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--player-bg)" }}>
      {/* Game header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{GAME_ICONS[breakData.gameType]}</span>
          <span
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: 18,
              color: "var(--brand-primary)",
              letterSpacing: "0.05em",
            }}
          >
            {GAME_LABELS[breakData.gameType]}
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(0,220,222,0.1)",
            border: "1px solid rgba(0,220,222,0.2)",
            color: "var(--brand-primary)",
            fontFamily: "var(--font-fira)",
          }}
        >
          BREAK
        </span>
      </div>

      <div className="flex-1">
        {breakData.gameType === "flying-math" && (
          <FlyingMath gameLevel={breakData.level} onComplete={handleComplete} />
        )}
        {breakData.gameType === "typing" && (
          <TypingGame gameLevel={breakData.level} onComplete={handleComplete} />
        )}
        {breakData.gameType === "robocody" && (
          <RoboCody
            gameLevel={breakData.level}
            questions={breakData.robocodyQuestions}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}
