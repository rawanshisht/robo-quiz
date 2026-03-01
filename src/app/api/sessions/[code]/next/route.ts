import { auth } from "@/lib/auth";
import {
  getSessionByCode,
  advanceQuestion,
  finishSession,
  deleteSessionData,
  getLeaderboard,
} from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";
import type { QuestionEvent, EndEvent } from "@/types";

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

  if (nextIndex >= quiz.questions.length) {
    // Game over
    const leaderboard = await getLeaderboard(session.id);
    const endEvent: EndEvent = { final_rankings: leaderboard };
    await pusherServer.trigger(`game-${upperCode}`, "game:end", endEvent);
    await finishSession(session.id);
    // Delete ephemeral data after sending event
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
