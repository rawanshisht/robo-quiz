"use client";

import { useEffect, useState, useRef } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import type {
  TerritoryUpdateEvent,
  PlacementPromptEvent,
  PlacementConfirmEvent,
  TileState,
} from "@/types";

const COLS = 5;

interface Props {
  code: string;
  playerId: string;
  myTeam: "a" | "b" | null;
  teamAName: string;
  teamBName: string;
}

const TEAM_COLORS = {
  a: { bg: "rgba(0,112,243,0.8)", border: "#0070f3", muted: "rgba(0,112,243,0.25)" },
  b: { bg: "rgba(220,38,38,0.8)", border: "#dc2626", muted: "rgba(220,38,38,0.25)" },
};

export default function PlayerColorKingdom({
  code,
  playerId,
  myTeam,
  teamAName,
  teamBName,
}: Props) {
  const [grid, setGrid] = useState<TileState[]>(
    Array.from({ length: COLS * 4 }, (_, i) => ({ index: i, owner: null }))
  );
  const [placement, setPlacement] = useState<{
    validTiles: number[];
    expiresAt: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [placed, setPlaced] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind("game:territory:update", (data: TerritoryUpdateEvent) => {
      setGrid(data.grid);
    });

    channel.bind("game:placement:prompt", (data: PlacementPromptEvent) => {
      if (data.playerId !== playerId) return;
      setPlacement({ validTiles: data.validTiles, expiresAt: data.expiresAt });
      setPlaced(false);
      const remaining = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    });

    channel.bind("game:placement:confirm", (data: PlacementConfirmEvent) => {
      if (data.playerId === playerId) {
        setPlacement(null);
        setPlaced(true);
      }
    });

    channel.bind("game:question", () => {
      setPlacement(null);
      setPlaced(false);
    });

    return () => {
      channel.unbind("game:territory:update");
      channel.unbind("game:placement:prompt");
      channel.unbind("game:placement:confirm");
      channel.unbind("game:question");
    };
  }, [code, playerId]);

  // Countdown for placement window
  useEffect(() => {
    if (!placement) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((placement.expiresAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        setPlacement(null);
        clearInterval(intervalRef.current!);
      }
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [placement]);

  async function handleTileTap(tileIndex: number) {
    if (!placement || placed) return;
    if (!placement.validTiles.includes(tileIndex)) return;

    await fetch(`/api/sessions/${code}/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId, tile_index: tileIndex }),
    });
  }

  const teamName = myTeam
    ? myTeam === "a" ? teamAName : teamBName
    : null;
  const teamColor = myTeam ? TEAM_COLORS[myTeam] : null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Team badge */}
      {teamName && teamColor && (
        <div
          className="rounded-xl px-4 py-2 text-center border text-sm font-bold"
          style={{
            background: teamColor.muted,
            borderColor: teamColor.border,
            color: teamColor.border,
            fontFamily: "var(--font-syne)",
          }}
        >
          {teamName}
        </div>
      )}

      {/* Placement prompt */}
      {placement && !placed && (
        <div
          className="rounded-xl border px-4 py-3 text-center"
          style={{
            background: "rgba(0,220,222,0.07)",
            borderColor: "var(--brand-primary)",
          }}
        >
          <p
            className="text-xs font-bold mb-1"
            style={{ color: "var(--brand-primary)", fontFamily: "var(--font-syne)" }}
          >
            Tap a tile to claim! ({timeLeft}s)
          </p>
        </div>
      )}

      {placed && (
        <div
          className="rounded-xl border px-4 py-2 text-center text-xs font-bold"
          style={{
            background: "rgba(0,220,222,0.07)",
            borderColor: "var(--brand-primary)",
            color: "var(--brand-primary)",
            fontFamily: "var(--font-syne)",
          }}
        >
          Tile claimed!
        </div>
      )}

      {/* Mini grid */}
      <div
        className="grid gap-1 w-full"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {grid.map((tile) => {
          const isValid = placement?.validTiles.includes(tile.index) && !placed;
          const tileTeamColor = tile.owner ? TEAM_COLORS[tile.owner] : null;

          return (
            <button
              key={tile.index}
              onClick={() => handleTileTap(tile.index)}
              disabled={!isValid}
              className="rounded-md border flex items-center justify-center transition-all"
              style={{
                aspectRatio: "1",
                background: tileTeamColor
                  ? tileTeamColor.bg
                  : isValid
                  ? "rgba(0,220,222,0.15)"
                  : "rgba(255,255,255,0.03)",
                borderColor: isValid
                  ? "var(--brand-primary)"
                  : tileTeamColor
                  ? tileTeamColor.border
                  : "rgba(255,255,255,0.06)",
                opacity: !placement || isValid || tile.owner ? 1 : 0.35,
                cursor: isValid ? "pointer" : "default",
                transform: isValid ? "scale(1)" : "scale(1)",
                boxShadow: isValid ? "0 0 8px rgba(0,220,222,0.3)" : "none",
              }}
            >
              {tile.owner && (
                <span
                  className="text-xs font-black select-none"
                  style={{ fontFamily: "var(--font-bebas)", color: "white" }}
                >
                  {tile.owner.toUpperCase()}
                </span>
              )}
              {isValid && !tile.owner && (
                <span
                  className="text-xs font-black select-none"
                  style={{ color: "var(--brand-primary)", fontFamily: "var(--font-bebas)" }}
                >
                  +
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
