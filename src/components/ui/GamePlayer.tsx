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
    <div className="fixed inset-0 z-50 bg-gray-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
      <div className="text-5xl mb-4">⏸</div>
      <p className="text-2xl font-black">Game Paused</p>
      <p className="mt-2 text-gray-400 text-sm">Waiting for the host to resume…</p>
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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-5xl mb-4">🏆</p>
          <h1 className="text-3xl font-black mb-1">Game Over!</h1>
          {myRank > 0 && (
            <p className="text-gray-400 mb-6">
              You finished{" "}
              <span className="text-white font-bold">#{myRank}</span> with{" "}
              <span className="text-yellow-400 font-bold">
                {myEntry?.score.toLocaleString()} pts
              </span>
            </p>
          )}
          <ol className="flex flex-col gap-2 text-left">
            {finalRankings.slice(0, 5).map((entry, i) => (
              <li
                key={entry.nickname}
                className={`flex items-center justify-between rounded-xl px-5 py-3 border ${
                  entry.nickname === nickname
                    ? "bg-blue-600/20 border-blue-500"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-black w-6 text-center ${
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
                <span className="font-black tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
          <button
            onClick={() => {
              localStorage.removeItem(`roboquiz_${code}`);
              router.push("/play");
            }}
            className="mt-6 w-full rounded-xl bg-blue-600 py-4 text-lg font-bold hover:bg-blue-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
