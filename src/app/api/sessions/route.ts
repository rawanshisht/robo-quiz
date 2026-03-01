import { auth } from "@/lib/auth";
import { createSession } from "@/lib/db/sessions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quiz_id } = await request.json();
  if (!quiz_id) {
    return NextResponse.json({ error: "quiz_id is required" }, { status: 400 });
  }

  const gameSession = await createSession(quiz_id, session.user.id);
  return NextResponse.json({
    room_code: gameSession.room_code,
    session_id: gameSession.id,
  });
}
