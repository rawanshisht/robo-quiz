"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import type { RaceUpdateEvent, RobotPosition } from "@/types";

const TRACK_LENGTH = 20;

const ROBOT_COLORS = [
  "#00dcde", "#ff00bf", "#ff9752", "#a78bfa",
  "#34d399", "#f87171", "#fbbf24", "#60a5fa",
  "#e879f9", "#4ade80",
];

interface Props {
  code: string;
  initialPositions?: RobotPosition[];
}

export default function HostRobotRun({ code, initialPositions = [] }: Props) {
  const [positions, setPositions] = useState<RobotPosition[]>(initialPositions);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind("game:race:update", (data: RaceUpdateEvent) => {
      setPositions(data.positions);
    });

    channel.bind("game:race:finish", (data: { winnerId: string }) => {
      setWinnerId(data.winnerId);
    });

    channel.bind("game:robots:assigned", (data: { assignments: RobotPosition[] }) => {
      setPositions(
        data.assignments.map((a) => ({ ...a, tile: 0 }))
      );
    });

    return () => {
      channel.unbind("game:race:update");
      channel.unbind("game:race:finish");
      channel.unbind("game:robots:assigned");
    };
  }, [code]);

  const leader = positions.length > 0
    ? positions.reduce((best, p) => (p.tile > best.tile ? p : best))
    : null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Leader banner */}
      {leader && (
        <div
          className="rounded-xl px-4 py-2 flex items-center justify-between border"
          style={{
            background: "rgba(0,220,222,0.07)",
            borderColor: "var(--brand-primary)",
          }}
        >
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}>
            Leader
          </span>
          <span className="font-black text-sm" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-syne)" }}>
            🤖#{leader.robotNumber} {leader.nickname}
          </span>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)", fontFamily: "var(--font-fira)" }}>
            Tile {leader.tile}/{TRACK_LENGTH}
          </span>
        </div>
      )}

      {/* Race tracks */}
      <div className="flex flex-col gap-2">
        {positions.map((p) => {
          const color = ROBOT_COLORS[(p.robotNumber - 1) % ROBOT_COLORS.length];
          const pct = (p.tile / TRACK_LENGTH) * 100;
          const isWinner = winnerId === p.playerId;
          const isLeader = leader?.playerId === p.playerId;

          return (
            <div key={p.playerId} className="flex items-center gap-2">
              {/* Robot label */}
              <div
                className="flex items-center gap-1.5 shrink-0"
                style={{ width: "6rem" }}
              >
                <span className="text-base">🤖</span>
                <div>
                  <p
                    className="text-xs font-black leading-none"
                    style={{ color, fontFamily: "var(--font-fira)" }}
                  >
                    #{p.robotNumber}
                  </p>
                  <p
                    className="text-xs leading-none truncate"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)", maxWidth: "4.5rem" }}
                  >
                    {p.nickname}
                  </p>
                </div>
              </div>

              {/* Track bar */}
              <div
                className="flex-1 rounded-full overflow-hidden border"
                style={{
                  height: "1.5rem",
                  background: "rgba(255,255,255,0.04)",
                  borderColor: isLeader ? color : "rgba(255,255,255,0.07)",
                  boxShadow: isLeader ? `0 0 8px ${color}55` : "none",
                }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isWinner
                      ? `linear-gradient(90deg, ${color}, #fbbf24)`
                      : color,
                    minWidth: pct > 0 ? "1.5rem" : "0",
                    transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                />
              </div>

              {/* Tile count */}
              <span
                className="text-xs font-bold tabular-nums shrink-0"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-fira)", width: "3rem", textAlign: "right" }}
              >
                {p.tile}/{TRACK_LENGTH}
              </span>

              {isWinner && (
                <span className="text-base shrink-0">🏆</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
