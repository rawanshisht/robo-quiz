import { getSessionByCode, getPlayersInSession, setModeState } from "@/lib/db/sessions";
import { pusherServer } from "@/lib/pusher/server";
import { NextResponse } from "next/server";
import type { TerritoryUpdateEvent, PlacementConfirmEvent } from "@/types";
import type { ColorKingdomState } from "@/lib/game-modes/color-kingdom/types";
import { getValidPlacements, placeTile, countTiles } from "@/lib/game-modes/color-kingdom/logic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { player_id, tile_index } = await request.json();

  if (!player_id || tile_index === undefined) {
    return NextResponse.json({ error: "player_id and tile_index required" }, { status: 400 });
  }

  const session = await getSessionByCode(code);
  if (!session || session.status !== "active" || session.mode !== "color-kingdom") {
    return NextResponse.json({ error: "No active Color Kingdom session" }, { status: 400 });
  }

  const currentState = session.mode_state as ColorKingdomState | null;
  if (!currentState) {
    return NextResponse.json({ error: "No game state" }, { status: 400 });
  }

  // Validate player has a pending placement
  const now = Date.now();
  const pending = currentState.pendingPlacements.find(
    (p) => p.playerId === player_id && p.expiresAt > now
  );
  if (!pending) {
    return NextResponse.json({ error: "No active placement window" }, { status: 403 });
  }

  // Validate player identity + team
  const players = await getPlayersInSession(session.id);
  const player = players.find((p) => p.id === player_id);
  if (!player?.team) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Server-side adjacency check
  const validTiles = getValidPlacements(currentState.grid, player.team);
  if (!validTiles.includes(tile_index)) {
    return NextResponse.json({ error: "Invalid tile" }, { status: 422 });
  }

  // Place tile and remove the used pending placement
  const newGrid = placeTile(currentState.grid, tile_index, player.team);
  const newPending = currentState.pendingPlacements.filter(
    (p) => p.playerId !== player_id
  );
  const newState: ColorKingdomState = {
    grid: newGrid,
    pendingPlacements: newPending,
  };
  await setModeState(session.id, newState);

  const upperCode = code.toUpperCase();
  const scores = countTiles(newGrid);

  const confirmEvent: PlacementConfirmEvent = {
    tileIndex: tile_index,
    team: player.team,
    playerId: player_id,
  };
  const territoryEvent: TerritoryUpdateEvent = {
    grid: newGrid,
    scoreA: scores.a,
    scoreB: scores.b,
  };

  await pusherServer.trigger(`game-${upperCode}`, "game:placement:confirm", confirmEvent);
  await pusherServer.trigger(`game-${upperCode}`, "game:territory:update", territoryEvent);

  return NextResponse.json({ ok: true });
}
