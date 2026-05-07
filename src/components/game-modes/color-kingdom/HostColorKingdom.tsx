"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import type { TerritoryUpdateEvent, PlacementConfirmEvent, TileState } from "@/types";

const COLS = 5;
const ROWS = 4;

interface Props {
  code: string;
  teamAName: string;
  teamBName: string;
}

const TEAM_COLORS = {
  a: { bg: "rgba(0,112,243,0.85)", border: "#0070f3", label: "#93c5fd" },
  b: { bg: "rgba(220,38,38,0.85)", border: "#dc2626", label: "#fca5a5" },
};

export default function HostColorKingdom({ code, teamAName, teamBName }: Props) {
  const [grid, setGrid] = useState<TileState[]>(
    Array.from({ length: COLS * ROWS }, (_, i) => ({ index: i, owner: null }))
  );
  const [scoreA, setScoreA] = useState(1);
  const [scoreB, setScoreB] = useState(1);
  const [flashTile, setFlashTile] = useState<number | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind("game:territory:update", (data: TerritoryUpdateEvent) => {
      setGrid(data.grid);
      setScoreA(data.scoreA);
      setScoreB(data.scoreB);
    });

    channel.bind("game:placement:confirm", (data: PlacementConfirmEvent) => {
      setFlashTile(data.tileIndex);
      setTimeout(() => setFlashTile(null), 600);
    });

    return () => {
      channel.unbind("game:territory:update");
      channel.unbind("game:placement:confirm");
    };
  }, [code]);

  const total = COLS * ROWS;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Team score bar */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 flex items-center justify-between rounded-xl px-4 py-2 border"
          style={{ background: "rgba(0,112,243,0.1)", borderColor: "rgba(0,112,243,0.4)" }}
        >
          <span className="font-black text-sm" style={{ color: "#93c5fd", fontFamily: "var(--font-syne)" }}>
            {teamAName}
          </span>
          <span className="font-black text-2xl" style={{ color: "#93c5fd", fontFamily: "var(--font-bebas)" }}>
            {scoreA}
          </span>
        </div>
        <span className="text-xs font-bold" style={{ color: "var(--text-muted)", fontFamily: "var(--font-fira)" }}>
          / {total}
        </span>
        <div
          className="flex-1 flex items-center justify-between rounded-xl px-4 py-2 border"
          style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.4)" }}
        >
          <span className="font-black text-2xl" style={{ color: "#fca5a5", fontFamily: "var(--font-bebas)" }}>
            {scoreB}
          </span>
          <span className="font-black text-sm" style={{ color: "#fca5a5", fontFamily: "var(--font-syne)" }}>
            {teamBName}
          </span>
        </div>
      </div>

      {/* Territory grid */}
      <div
        className="grid gap-1.5 w-full"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {grid.map((tile) => {
          const isFlashing = flashTile === tile.index;
          const colors = tile.owner ? TEAM_COLORS[tile.owner] : null;
          return (
            <div
              key={tile.index}
              className="rounded-lg flex items-center justify-center border transition-all"
              style={{
                aspectRatio: "1",
                background: colors ? colors.bg : "rgba(255,255,255,0.04)",
                borderColor: colors ? colors.border : "rgba(255,255,255,0.08)",
                transform: isFlashing ? "scale(1.12)" : "scale(1)",
                boxShadow: isFlashing
                  ? `0 0 18px ${colors?.border ?? "white"}`
                  : "none",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              {tile.owner && (
                <span
                  className="font-black text-lg select-none"
                  style={{
                    fontFamily: "var(--font-bebas)",
                    color: colors?.label,
                    letterSpacing: "0.05em",
                  }}
                >
                  {tile.owner.toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
