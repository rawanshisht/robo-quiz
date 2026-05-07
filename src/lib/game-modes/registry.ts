import type { GameMode } from "@/types";
import type { GameModeAdapter } from "./types";
import { classicAdapter } from "./classic/adapter";
import { colorKingdomAdapter } from "./color-kingdom/adapter";
import { robotRunAdapter } from "./robot-run/adapter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODE_REGISTRY: Record<GameMode, GameModeAdapter<any>> = {
  classic: classicAdapter,
  "color-kingdom": colorKingdomAdapter,
  "robot-run": robotRunAdapter,
};

export function getAdapter(mode: GameMode): GameModeAdapter {
  return MODE_REGISTRY[mode] ?? classicAdapter;
}
