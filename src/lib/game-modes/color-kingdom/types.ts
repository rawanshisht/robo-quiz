import type { TileState } from "@/types";

export interface PendingPlacement {
  playerId: string;
  expiresAt: number; // unix ms
}

export interface ColorKingdomState {
  grid: TileState[];
  pendingPlacements: PendingPlacement[];
}
