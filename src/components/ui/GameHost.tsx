"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";
import HostLobby from "./HostLobby";
import HostQuestion from "./HostQuestion";
import HostReveal from "./HostReveal";
import type {
  LobbyUpdateEvent,
  QuestionEvent,
  AnswerCountEvent,
  RevealEvent,
  EndEvent,
  PauseEvent,
  LeaderboardEntry,
} from "@/types";

type Phase = "lobby" | "question" | "reveal" | "end";

interface Props {
  code: string;
  quizTitle: string;
  questionCount: number;
  initialPlayers: string[];
}

export default function GameHost({
  code,
  quizTitle,
  questionCount,
  initialPlayers,
}: Props) {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [players, setPlayers] = useState<string[]>(initialPlayers);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionEvent | null>(null);
  const [answerCount, setAnswerCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(initialPlayers.length);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [revealData, setRevealData] = useState<RevealEvent | null>(null);
  const [finalRankings, setFinalRankings] = useState<LeaderboardEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [endingEarly, setEndingEarly] = useState(false);
  const router = useRouter();

  const revealCalledRef = useRef(false);
  const pausedMsRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // Reset pause tracking + revealCalledRef when a new question starts
  useEffect(() => {
    pausedMsRef.current = 0;
    pausedAtRef.current = null;
    revealCalledRef.current = false;
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

  // Countdown — runs when phase is 'question' and not paused
  useEffect(() => {
    if (phase !== "question" || !currentQuestion || isPaused) return;

    const elapsed =
      (Date.now() - new Date(currentQuestion.started_at).getTime() - pausedMsRef.current) / 1000;
    const initial = Math.max(0, Math.ceil(currentQuestion.duration - elapsed));
    setTimeRemaining(initial);

    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      if (!revealCalledRef.current) {
        revealCalledRef.current = true;
        fetch(`/api/sessions/${code}/reveal`, { method: "POST" });
      }
    }, initial * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase, currentQuestion?.started_at, isPaused, code]);

  // Pusher subscriptions
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind("game:lobby-update", (data: LobbyUpdateEvent) => {
      setPlayers(data.players);
      setTotalPlayers(data.players.length);
    });

    channel.bind("game:question", (data: QuestionEvent) => {
      setCurrentQuestion(data);
      setAnswerCount(0);
      setTotalPlayers((t) => t); // keep existing count
      setPhase("question");
    });

    channel.bind("game:answer-count", (data: AnswerCountEvent) => {
      setAnswerCount(data.answered);
      setTotalPlayers(data.total);
    });

    channel.bind("game:reveal", (data: RevealEvent) => {
      revealCalledRef.current = true;
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

  async function handleStart() {
    await fetch(`/api/sessions/${code}/start`, { method: "POST" });
  }

  async function handleRevealNow() {
    if (revealCalledRef.current) return;
    revealCalledRef.current = true;
    await fetch(`/api/sessions/${code}/reveal`, { method: "POST" });
  }

  async function handleNext() {
    await fetch(`/api/sessions/${code}/next`, { method: "POST" });
  }

  async function handleTogglePause() {
    const next = !isPaused;
    setIsPaused(next);
    await fetch(`/api/sessions/${code}/pause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: next }),
    });
  }

  async function handleEndEarly() {
    if (!confirm("End the game now? All players will see the final leaderboard."))
      return;
    setEndingEarly(true);
    await fetch(`/api/sessions/${code}`, { method: "DELETE" });
  }

  if (phase === "lobby") {
    return (
      <HostLobby
        code={code}
        quizTitle={quizTitle}
        questionCount={questionCount}
        initialPlayers={players}
        onStart={handleStart}
        onEndEarly={handleEndEarly}
      />
    );
  }

  if (phase === "question" && currentQuestion) {
    return (
      <HostQuestion
        question={currentQuestion}
        timeRemaining={timeRemaining}
        answerCount={answerCount}
        totalPlayers={totalPlayers}
        isPaused={isPaused}
        onRevealNow={handleRevealNow}
        onTogglePause={handleTogglePause}
        onEndEarly={handleEndEarly}
      />
    );
  }

  if (phase === "reveal" && revealData && currentQuestion) {
    return (
      <HostReveal
        reveal={revealData}
        question={currentQuestion}
        isPaused={isPaused}
        onNext={handleNext}
        onTogglePause={handleTogglePause}
        onEndEarly={handleEndEarly}
      />
    );
  }

  if (phase === "end") {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p
              className="t-title mb-2"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Game Over
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
            >
              {quizTitle}
            </p>
          </div>
          <ol className="flex flex-col gap-2">
            {finalRankings.map((entry, i) => {
              const medalColor =
                i === 0
                  ? "var(--brand-primary)"
                  : i === 1
                    ? "#d1d5db"
                    : i === 2
                      ? "var(--brand-tertiary)"
                      : "#374151";
              return (
                <li
                  key={entry.nickname}
                  className="flex items-center justify-between rounded-xl px-5 py-3 border"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border)",
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
            onClick={() => router.push("/quizzes")}
            className="t-button uppercase mt-6 w-full rounded-xl py-4 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              color: "#09090f",
              fontFamily: "var(--font-syne)",
              boxShadow: "0 4px 20px rgba(0,220,222,0.25)",
            }}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return null;
}
