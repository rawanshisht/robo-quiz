import { getSessionByCode, startQuestion } from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";
import type { QuestionEvent } from "@/types";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const session = await getSessionByCode(code);

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  // Idempotency: question_started_at is updated when the break ends.
  // If it was set within the last 5 seconds, the break already ended — skip.
  if (session.question_started_at) {
    const ms = Date.now() - new Date(session.question_started_at).getTime();
    if (ms < 5000) return NextResponse.json({ ok: true });
  }

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 400 });
  }

  const qIndex = session.current_q;
  const q = quiz.questions[qIndex];

  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 400 });
  }

  await startQuestion(session.id, qIndex);

  const started_at = new Date().toISOString();
  const event: QuestionEvent = {
    index: qIndex,
    total: quiz.questions.length,
    text: q.text,
    type: q.type,
    image_url: q.image_url,
    options: q.options.map(({ id, text }) => ({ id, text })),
    duration: 20,
    started_at,
  };

  await pusherServer.trigger(`game-${upperCode}`, "game:question", event);
  return NextResponse.json({ ok: true });
}
