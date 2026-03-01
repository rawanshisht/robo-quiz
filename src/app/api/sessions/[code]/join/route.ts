import { getSessionByCode, addPlayer, getPlayersInSession } from "@/lib/db/sessions";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { nickname } = await request.json();

  if (!nickname?.trim()) {
    return NextResponse.json(
      { error: "Nickname is required" },
      { status: 400 }
    );
  }

  const session = await getSessionByCode(code);
  if (!session || session.status !== "lobby") {
    return NextResponse.json(
      { error: "Session not found or already started" },
      { status: 404 }
    );
  }

  const player = await addPlayer(session.id, nickname.trim());

  const players = await getPlayersInSession(session.id);
  await pusherServer.trigger(`game-${code.toUpperCase()}`, "game:lobby-update", {
    players: players.map((p) => p.nickname),
  });

  return NextResponse.json({ player_id: player.id });
}
