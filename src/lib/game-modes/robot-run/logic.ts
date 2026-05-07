import type { GamePlayer } from "@/types";
import type { RobotRunPosition } from "./types";

export const TRACK_LENGTH = 20;

export function initPositions(players: GamePlayer[]): RobotRunPosition[] {
  return players.map((p, i) => ({
    playerId: p.id,
    nickname: p.nickname,
    robotNumber: i + 1,
    tile: 0,
  }));
}

/**
 * Maps answer latency (ms) to tiles advanced.
 * 0–2 s → 3 tiles, 2–5 s → 2 tiles, 5–10 s → 1 tile, else → 0
 */
export function calcMovement(latencyMs: number): 0 | 1 | 2 | 3 {
  if (latencyMs <= 2_000) return 3;
  if (latencyMs <= 5_000) return 2;
  if (latencyMs <= 10_000) return 1;
  return 0;
}

export function advanceRobot(
  positions: RobotRunPosition[],
  playerId: string,
  tiles: number
): RobotRunPosition[] {
  return positions.map((p) => {
    if (p.playerId !== playerId) return p;
    const newTile = Math.min(p.tile + tiles, TRACK_LENGTH);
    return {
      ...p,
      tile: newTile,
      finishedAt: newTile >= TRACK_LENGTH ? Date.now() : p.finishedAt,
    };
  });
}

/** Returns playerId of the first finisher, or null if nobody has finished. */
export function checkFinish(
  positions: RobotRunPosition[]
): string | null {
  const finishers = positions
    .filter((p) => p.tile >= TRACK_LENGTH && p.finishedAt !== undefined)
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  return finishers[0]?.playerId ?? null;
}

export function getLeader(positions: RobotRunPosition[]): RobotRunPosition {
  return positions.reduce((best, p) => (p.tile > best.tile ? p : best));
}
