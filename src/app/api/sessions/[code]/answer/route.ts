import {
  getSessionByCode,
  hasPlayerAnswered,
  recordAnswer,
  addPointsToPlayer,
  getAnswerCountForQuestion,
  getPlayersInSession,
  getLeaderboard,
  setModeState,
} from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { getAdapter } from "@/lib/game-modes/registry";
import { NextResponse } from "next/server";
import type { RevealEvent } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { player_id, option_id } = await request.json();

  if (!player_id) {
    return NextResponse.json({ error: "player_id required" }, { status: 400 });
  }

  const session = await getSessionByCode(code);
  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  const quiz = await getQuizById(session.quiz_id);
  const question = quiz?.questions[session.current_q];
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 400 });
  }

  if (await hasPlayerAnswered(player_id, question.id)) {
    return NextResponse.json({ error: "Already answered" }, { status: 409 });
  }

  await recordAnswer(player_id, question.id, option_id ?? null);

  // Compute score
  let correct = false;
  let pointsEarned = 0;

  if (option_id) {
    const correctOption = question.options.find((o) => o.is_correct);
    correct = correctOption?.id === option_id;

    if (correct && session.question_started_at) {
      const elapsed =
        (Date.now() - new Date(session.question_started_at).getTime()) / 1000;
      const timeRemaining = Math.max(0, 20 - elapsed);
      pointsEarned = Math.round((1000 * timeRemaining) / 20);
      await addPointsToPlayer(player_id, pointsEarned);
    }
  }

  const upperCode = code.toUpperCase();
  const players = await getPlayersInSession(session.id);
  const player = players.find((p) => p.id === player_id);
  const answerCount = await getAnswerCountForQuestion(session.id, question.id);

  await pusherServer.trigger(`game-${upperCode}`, "game:answer-count", {
    answered: answerCount,
    total: players.length,
  });

  // Run mode adapter onAnswer hook
  let tilesMoved: number | null = null;
  if (player) {
    const adapter = getAdapter(session.mode);
    const currentState = session.mode_state ?? {};
    const { stateUpdate, events } = await adapter.onAnswer(
      session,
      player,
      { playerId: player_id, optionId: option_id ?? null, isCorrect: correct, answeredAt: new Date() },
      currentState
    );
    if (stateUpdate !== null && typeof stateUpdate === "object" && Object.keys(stateUpdate).length > 0) {
      await setModeState(session.id, { ...currentState, ...stateUpdate });
      // For Robot Run: compute how many tiles this player gained
      if (session.mode === "robot-run") {
        type Pos = { playerId: string; tile: number };
        const oldPositions = (currentState as { positions?: Pos[] }).positions ?? [];
        const newPositions = (stateUpdate as { positions?: Pos[] }).positions ?? [];
        const oldTile = oldPositions.find((p) => p.playerId === player_id)?.tile ?? 0;
        const newTile = newPositions.find((p) => p.playerId === player_id)?.tile ?? 0;
        tilesMoved = newTile - oldTile;
      }
    }
    for (const e of events) {
      await pusherServer.trigger(`game-${upperCode}`, e.event, e.data);
    }
  }

  // Auto-reveal when everyone has answered
  if (answerCount >= players.length) {
    const correctOption = question.options.find((o) => o.is_correct);
    const leaderboard = await getLeaderboard(session.id);
    const revealEvent: RevealEvent = {
      correct_option_id: correctOption?.id ?? "",
      leaderboard,
    };
    await pusherServer.trigger(`game-${upperCode}`, "game:reveal", revealEvent);
  }

  return NextResponse.json({ correct, points_earned: pointsEarned, tiles_moved: tilesMoved });
}
