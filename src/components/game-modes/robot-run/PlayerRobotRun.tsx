"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import type { RaceUpdateEvent, RobotPosition } from "@/types";

const TRACK_LENGTH = 20;

interface Props {
  code: string;
  playerId: string;
  movementFeedback?: number | null; // tiles gained last answer
}

export default function PlayerRobotRun({ code, playerId, movementFeedback }: Props) {
  const [myPosition, setMyPosition] = useState<RobotPosition | null>(null);
  const [leaderPosition, setLeaderPosition] = useState<RobotPosition | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${code}`);

    channel.bind("game:race:update", (data: RaceUpdateEvent) => {
      const me = data.positions.find((p) => p.playerId === playerId) ?? null;
      const leader = data.positions.reduce(
        (best, p) => (p.tile > best.tile ? p : best),
        data.positions[0]
      );
      setMyPosition(me);
      setLeaderPosition(leader ?? null);
    });

    channel.bind("game:robots:assigned", (data: { assignments: RobotPosition[] }) => {
      const me = data.assignments.find((a) => a.playerId === playerId) ?? null;
      if (me) setMyPosition({ ...me, tile: 0 });
    });

    return () => {
      channel.unbind("game:race:update");
      channel.unbind("game:robots:assigned");
    };
  }, [code, playerId]);

  if (!myPosition) return null;

  const myPct = (myPosition.tile / TRACK_LENGTH) * 100;
  const leaderPct = leaderPosition
    ? (leaderPosition.tile / TRACK_LENGTH) * 100
    : 0;
  const isLeader = leaderPosition?.playerId === playerId;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Robot identity */}
      <div
        className="rounded-xl px-4 py-3 border flex items-center justify-between"
        style={{
          background: "rgba(0,220,222,0.06)",
          borderColor: "var(--brand-primary)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <p
              className="font-black text-sm leading-none"
              style={{ color: "var(--brand-primary)", fontFamily: "var(--font-fira)" }}
            >
              Robot #{myPosition.robotNumber}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
            >
              {isLeader ? "You're in the lead!" : `Leader: ${leaderPosition?.nickname ?? "—"}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="font-black tabular-nums"
            style={{ color: "var(--text)", fontFamily: "var(--font-fira)", fontSize: "1.25rem" }}
          >
            {myPosition.tile}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              /{TRACK_LENGTH}
            </span>
          </p>
        </div>
      </div>

      {/* Movement feedback */}
      {movementFeedback != null && movementFeedback > 0 && (
        <div
          className="rounded-xl border px-4 py-2 text-center text-sm font-bold"
          style={{
            background: "rgba(0,220,222,0.08)",
            borderColor: "var(--brand-primary)",
            color: "var(--brand-primary)",
            fontFamily: "var(--font-syne)",
          }}
        >
          +{movementFeedback} tile{movementFeedback !== 1 ? "s" : ""}! 🚀
        </div>
      )}

      {/* Mini track — my robot vs leader */}
      <div className="flex flex-col gap-2">
        {/* My robot */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold shrink-0"
            style={{ color: "var(--brand-primary)", fontFamily: "var(--font-fira)", width: "1.5rem" }}
          >
            Me
          </span>
          <div
            className="flex-1 rounded-full overflow-hidden"
            style={{ height: "1.25rem", background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${myPct}%`,
                background: "var(--brand-primary)",
                minWidth: myPct > 0 ? "1.25rem" : "0",
                transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          </div>
        </div>

        {/* Leader (if not me) */}
        {!isLeader && leaderPosition && (
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold shrink-0 truncate"
              style={{ color: "#f87171", fontFamily: "var(--font-fira)", width: "1.5rem" }}
            >
              #1
            </span>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: "1.25rem", background: "rgba(255,255,255,0.05)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${leaderPct}%`,
                  background: "#f87171",
                  minWidth: leaderPct > 0 ? "1.25rem" : "0",
                  transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
