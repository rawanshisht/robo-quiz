import { getSessionByCode, addPointsToPlayer } from "@/lib/db/sessions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSessionByCode(code);

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  const body = await req.json();
  const { player_id, points } = body;

  if (!player_id || typeof points !== "number") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const safePoints = Math.max(0, Math.min(10000, Math.floor(points)));
  await addPointsToPlayer(player_id, safePoints);

  return NextResponse.json({ ok: true });
}
