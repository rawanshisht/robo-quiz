import { auth } from "@/lib/auth";
import { getSessionByCode, startQuestion } from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";
import type { QuestionEvent } from "@/types";

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

  if (!session || session.status !== "lobby") {
    return NextResponse.json({ error: "Session not available" }, { status: 400 });
  }

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz || quiz.questions.length === 0) {
    return NextResponse.json({ error: "Quiz has no questions" }, { status: 400 });
  }

  await startQuestion(session.id, 0);

  const q = quiz.questions[0];
  const started_at = new Date().toISOString();

  const event: QuestionEvent = {
    index: 0,
    total: quiz.questions.length,
    text: q.text,
    type: q.type,
    image_url: q.image_url,
    options: q.options.map(({ id, text }) => ({ id, text })),
    duration: 20,
    started_at,
  };

  await pusherServer.trigger(`game-${code.toUpperCase()}`, "game:question", event);
  return NextResponse.json({ ok: true });
}
