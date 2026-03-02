"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import PlayerLobby from "./PlayerLobby";
import PlayerQuestion from "./PlayerQuestion";
import PlayerReveal from "./PlayerReveal";
import type {
  LobbyUpdateEvent,
  QuestionEvent,
  RevealEvent,
  EndEvent,
  PauseEvent,
  LeaderboardEntry,
} from "@/types";

type Phase = "lobby" | "question" | "reveal" | "end";

function PauseOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 backdrop-blur-sm flex flex-col items-center justify-center text-white"
      style={{ background: "rgba(9,9,15,0.93)" }}
    >
      <div
        className="mb-4 w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2"
        style={{
          borderColor: "var(--brand-primary)",
          background: "rgba(0,220,222,0.1)",
          boxShadow: "0 0 32px rgba(0,220,222,0.25)",
          fontFamily: "var(--font-bebas)",
        }}
      >
        ⏸
      </div>
      <p
        className="leading-none"
        style={{
          fontFamily: "var(--font-bebas)",
          fontSize: "2.5rem",
          letterSpacing: "0.08em",
          background:
            "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Game Paused
      </p>
      <p
        className="mt-2 text-sm"
        style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
      >
        Waiting for the host to resume…
      </p>
    </div>
  );
}

export default function GamePlayer({ code }: { code: string }) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionEvent | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [answered, setAnswered] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [revealData, setRevealData] = useState<RevealEvent | null>(null);
  const [finalRankings, setFinalRankings] = useState<LeaderboardEntry[]>([]);

  const [isPaused, setIsPaused] = useState(false);
  const submittingRef = useRef(false);
  const pausedMsRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // Load identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`roboquiz_${code}`);
    if (!stored) {
      router.replace("/play");
      return;
    }
    const { player_id, nickname: n } = JSON.parse(stored);
    setPlayerId(player_id);
    setNickname(n);
  }, [code, router]);

  // Reset pause tracking when a new question starts
  useEffect(() => {
    pausedMsRef.current = 0;
    pausedAtRef.current = null;
  }, [currentQuestion?.started_at]);

  // Track accumulated pause duration (must be declared before countdown effect)
  useEffect(() => {
    if (isPaused) {
      pausedAtRef.current = Date.now();
    } else if (pausedAtRef.current !== null) {
      pausedMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
  }, [isPaused]);

  // Countdown during question phase
  useEffect(() => {
    if (phase !== "question" || !currentQuestion || isPaused) return;

    const elapsed =
      (Date.now() - new Date(currentQuestion.started_at).getTime() - pausedMsRef.current) / 1000;
    const initial = Math.max(0, Math.ceil(currentQuestion.duration - elapsed));
    setTimeRemaining(initial);

    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentQuestion?.started_at, isPaused]);

  // Pusher subscriptions
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind("game:lobby-update", (data: LobbyUpdateEvent) => {
      setPlayerCount(data.players.length);
    });

    channel.bind("game:question", (data: QuestionEvent) => {
      setCurrentQuestion(data);
      setAnswered(false);
      setSelectedOptionId(null);
      setPointsEarned(0);
      submittingRef.current = false;
      setPhase("question");
    });

    channel.bind("game:reveal", (data: RevealEvent) => {
      setRevealData(data);
      setPhase("reveal");
    });

    channel.bind("game:end", (data: EndEvent) => {
      setFinalRankings(data.final_rankings);
      setPhase("end");
    });

    channel.bind("game:pause", (data: PauseEvent) => {
      setIsPaused(data.paused);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${code}`);
    };
  }, [code]);

  async function handleAnswer(optionId: string) {
    if (answered || submittingRef.current || !playerId) return;
    submittingRef.current = true;
    setAnswered(true);
    setSelectedOptionId(optionId);

    try {
      const res = await fetch(`/api/sessions/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, option_id: optionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPointsEarned(data.points_earned ?? 0);
      }
    } catch {
      // Answer recorded optimistically; reveal event will show result
    }
  }

  if (phase === "lobby") {
    return (
      <PlayerLobby
        code={code}
        nickname={nickname}
        playerCount={playerCount}
      />
    );
  }

  if (phase === "question" && currentQuestion) {
    return (
      <>
        <PlayerQuestion
          question={currentQuestion}
          timeRemaining={timeRemaining}
          answered={answered}
          selectedOptionId={selectedOptionId}
          onAnswer={handleAnswer}
        />
        {isPaused && <PauseOverlay />}
      </>
    );
  }

  if (phase === "reveal" && revealData) {
    return (
      <>
        <PlayerReveal
          reveal={revealData}
          selectedOptionId={selectedOptionId}
          pointsEarned={pointsEarned}
          nickname={nickname}
        />
        {isPaused && <PauseOverlay />}
      </>
    );
  }

  if (phase === "end") {
    const myRank = finalRankings.findIndex((e) => e.nickname === nickname) + 1;
    const myEntry = finalRankings.find((e) => e.nickname === nickname);

    return (
      <div
        className="min-h-screen text-white flex flex-col items-center justify-center p-6"
        style={{ background: "var(--player-bg)" }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-4xl mb-2" style={{ lineHeight: 1 }}>🏆</p>
            <p
              className="t-title"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Game Over!
            </p>
            {myRank > 0 && (
              <p
                className="text-sm mt-2"
                style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
              >
                You finished{" "}
                <span
                  className="font-black"
                  style={{
                    color: "var(--brand-primary)",
                    fontFamily: "var(--font-fira)",
                  }}
                >
                  #{myRank}
                </span>{" "}
                with{" "}
                <span
                  className="font-black"
                  style={{
                    color: "var(--brand-tertiary)",
                    fontFamily: "var(--font-fira)",
                  }}
                >
                  {myEntry?.score.toLocaleString()} pts
                </span>
              </p>
            )}
          </div>
          <ol className="flex flex-col gap-2">
            {finalRankings.slice(0, 5).map((entry, i) => {
              const medalColor =
                i === 0
                  ? "var(--brand-primary)"
                  : i === 1
                    ? "#d1d5db"
                    : i === 2
                      ? "var(--brand-tertiary)"
                      : "#374151";
              const isMe = entry.nickname === nickname;
              return (
                <li
                  key={entry.nickname}
                  className="flex items-center justify-between rounded-2xl px-5 py-3 border"
                  style={{
                    background: isMe
                      ? "rgba(255,0,191,0.08)"
                      : "rgba(255,255,255,0.04)",
                    borderColor: isMe
                      ? "rgba(255,0,191,0.3)"
                      : "rgba(255,255,255,0.07)",
                    boxShadow: isMe
                      ? "0 0 16px rgba(255,0,191,0.12)"
                      : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-black w-6 text-center"
                      style={{
                        fontFamily: "var(--font-bebas)",
                        color: medalColor,
                        fontSize: "1.2rem",
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
          <button
            onClick={() => {
              localStorage.removeItem(`roboquiz_${code}`);
              router.push("/play");
            }}
            className="t-button uppercase mt-6 w-full rounded-2xl py-4 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              color: "#09090f",
              fontFamily: "var(--font-syne)",
              boxShadow: "0 4px 24px rgba(0,220,222,0.3)",
            }}
          >
            Play Again 🎮
          </button>
        </div>
      </div>
    );
  }

  return null;
}
