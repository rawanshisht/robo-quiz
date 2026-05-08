import { auth } from "@/lib/auth";
import {
  getSessionByCode,
  getPlayersInSession,
  advanceQuestion,
  finishSession,
  deleteSessionData,
  getLeaderboard,
  setBreakPendingQuestion,
} from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { getAdapter } from "@/lib/game-modes/registry";
import { NextResponse } from "next/server";
import type { QuestionEvent, EndEvent, GameBreakStartEvent } from "@/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const session = await getSessionByCode(code);

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 400 });
  }

  const upperCode = code.toUpperCase();
  const nextIndex = session.current_q + 1;

  // Check for game break (every 5 questions, if mini game is configured)
  const shouldBreak =
    !!session.mini_game_type &&
    nextIndex % 3 === 0 &&
    nextIndex < quiz.questions.length;

  if (shouldBreak) {
    await setBreakPendingQuestion(session.id, nextIndex);
    const level = Math.min(5, Math.floor(nextIndex / 3));
    const event: GameBreakStartEvent = { gameType: session.mini_game_type!, level };

    if (session.mini_game_type === "robocody") {
      event.robocodyQuestions = quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options.map(({ id, text }) => ({ id, text })),
        correctId: q.options.find((o) => o.is_correct)!.id,
      }));
    }

    await pusherServer.trigger(`game-${upperCode}`, "game:break:start", event);
    return NextResponse.json({ ok: true });
  }

  // Ask adapter if the mode wants to end early (e.g. Robot Run race win)
  const adapter = getAdapter(session.mode);
  const currentState = session.mode_state ?? {};
  const { finished: modeFinished } = await adapter.onQuestionEnd(session, currentState);

  const isLastQuestion = nextIndex >= quiz.questions.length;

  if (isLastQuestion || modeFinished) {
    // Game over — get result from adapter for mode-specific winner info
    const players = await getPlayersInSession(session.id);
    const gameResult = await adapter.onGameEnd(session, players, currentState);
    const leaderboard = await getLeaderboard(session.id);
    const endEvent: EndEvent & { mode_result?: unknown } = {
      final_rankings: leaderboard,
      mode_result: gameResult,
    };
    await pusherServer.trigger(`game-${upperCode}`, "game:end", endEvent);
    await finishSession(session.id);
    await deleteSessionData(session.id);
  } else {
    // Next question
    await advanceQuestion(session.id, nextIndex);
    const q = quiz.questions[nextIndex];
    const started_at = new Date().toISOString();

    const event: QuestionEvent = {
      index: nextIndex,
      total: quiz.questions.length,
      text: q.text,
      type: q.type,
      image_url: q.image_url,
      options: q.options.map(({ id, text }) => ({ id, text })),
      duration: 20,
      started_at,
    };

    await pusherServer.trigger(`game-${upperCode}`, "game:question", event);
  }

  return NextResponse.json({ ok: true });
}
