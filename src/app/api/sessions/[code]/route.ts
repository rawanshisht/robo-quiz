import { auth } from "@/lib/auth";
import {
  getSessionByCode,
  getLeaderboard,
  finishSession,
  deleteSessionData,
} from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSessionByCode(code);

  if (!session || session.status === "finished") {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json({
    session_id: session.id,
    room_code: session.room_code,
    status: session.status,
    quiz: {
      title: quiz.title,
      question_count: quiz.questions.length,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const session = await getSessionByCode(code);
  if (!session || session.status === "finished") {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const leaderboard = await getLeaderboard(session.id);
  await pusherServer.trigger(`game-${code}`, "game:end", {
    final_rankings: leaderboard,
  });

  await finishSession(session.id);
  await deleteSessionData(session.id);

  return NextResponse.json({ ok: true });
}
