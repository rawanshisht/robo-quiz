import { auth } from "@/lib/auth";
import { getSessionByCode, getLeaderboard, setModeState } from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { pusherServer } from "@/lib/pusher/server";
import { getAdapter } from "@/lib/game-modes/registry";
import { NextResponse } from "next/server";
import type { RevealEvent } from "@/types";

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
  const question = quiz?.questions[session.current_q];
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 400 });
  }

  const correctOption = question.options.find((o) => o.is_correct);
  const leaderboard = await getLeaderboard(session.id);
  const upperCode = code.toUpperCase();

  const revealEvent: RevealEvent = {
    correct_option_id: correctOption?.id ?? "",
    leaderboard,
  };
  await pusherServer.trigger(`game-${upperCode}`, "game:reveal", revealEvent);

  // Run mode adapter onQuestionReveal hook
  const adapter = getAdapter(session.mode);
  const currentState = session.mode_state ?? {};
  const { stateUpdate, events } = await adapter.onQuestionReveal(session, currentState);
  if (Object.keys(stateUpdate).length > 0) {
    await setModeState(session.id, { ...currentState, ...stateUpdate });
  }
  for (const e of events) {
    await pusherServer.trigger(`game-${upperCode}`, e.event, e.data);
  }

  return NextResponse.json({ ok: true });
}
