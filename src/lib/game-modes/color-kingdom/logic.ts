import type { TileState } from "@/types";

const COLS = 5;
const ROWS = 4;
export const GRID_SIZE = COLS * ROWS; // 20

/** Build a flat index from (col, row) */
function idx(col: number, row: number): number {
  return row * COLS + col;
}

export function initGrid(): TileState[] {
  const grid: TileState[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
    index: i,
    owner: null,
  }));
  // Team A starts at top-left (0,0), Team B at bottom-right (4,3)
  grid[idx(0, 0)].owner = "a";
  grid[idx(4, 3)].owner = "b";
  return grid;
}

/** Returns 4-directional (N/S/E/W) neighbour indices for a tile. */
export function getAdjacentTiles(tileIndex: number): number[] {
  const col = tileIndex % COLS;
  const row = Math.floor(tileIndex / COLS);
  const neighbours: number[] = [];
  if (row > 0) neighbours.push(idx(col, row - 1)); // north
  if (row < ROWS - 1) neighbours.push(idx(col, row + 1)); // south
  if (col > 0) neighbours.push(idx(col - 1, row)); // west
  if (col < COLS - 1) neighbours.push(idx(col + 1, row)); // east
  return neighbours;
}

/** Returns tile indices a team can legally place on (adjacent to owned, not yet owned). */
export function getValidPlacements(
  grid: TileState[],
  team: "a" | "b"
): number[] {
  const owned = new Set(
    grid.filter((t) => t.owner === team).map((t) => t.index)
  );
  const valid = new Set<number>();
  for (const ownedIdx of owned) {
    for (const neighbour of getAdjacentTiles(ownedIdx)) {
      if (grid[neighbour].owner === null) valid.add(neighbour);
    }
  }
  return Array.from(valid);
}

export function placeTile(
  grid: TileState[],
  tileIndex: number,
  team: "a" | "b"
): TileState[] {
  const next = grid.map((t) => ({ ...t }));
  next[tileIndex].owner = team;
  return next;
}

export function countTiles(grid: TileState[]): { a: number; b: number } {
  return {
    a: grid.filter((t) => t.owner === "a").length,
    b: grid.filter((t) => t.owner === "b").length,
  };
}

/**
 * Determines the winner by tile count.
 * Tie-break: pass total correct answers per team.
 */
export function getWinner(
  grid: TileState[],
  correctA: number,
  correctB: number
): "a" | "b" | "tie" {
  const { a, b } = countTiles(grid);
  if (a > b) return "a";
  if (b > a) return "b";
  // Tile count is equal — break by total correct answers
  if (correctA > correctB) return "a";
  if (correctB > correctA) return "b";
  return "tie";
}
