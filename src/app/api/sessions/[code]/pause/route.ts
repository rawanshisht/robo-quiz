import { auth } from "@/lib/auth";
import { getSessionByCode, togglePause } from "@/lib/db/sessions";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const authSession = await auth();
  if (!authSession?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const session = await getSessionByCode(code);
  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { paused } = await request.json();
  await togglePause(session.id, paused);

  await pusherServer.trigger(`game-${code}`, "game:pause", { paused });

  return NextResponse.json({ paused });
}
