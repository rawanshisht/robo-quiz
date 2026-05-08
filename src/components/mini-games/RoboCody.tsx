"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MiniGameResult, RobocodyQuestion } from "@/types";

interface Ghost {
  id: number;
  row: number;
  col: number;
}

type GameState = "playing" | "won" | "dead";

const GRID_SIZES: Record<number, number> = { 1: 9, 2: 9, 3: 11, 4: 11, 5: 13 };
const GHOST_COUNTS: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 };
const GHOST_SPEEDS: Record<number, number> = { 1: 900, 2: 750, 3: 600, 4: 420, 5: 280 };
const CELL_SIZES: Record<number, number> = { 9: 34, 11: 28, 13: 24 };
const GHOST_COLORS = ["#ff4444", "#ff00bf", "#ff9752"];
const TARGET_PELLETS = 15;

function buildGrid(gridSize: number): { cells: ("empty" | "pellet")[]; robotStart: { row: number; col: number } } {
  const total = gridSize * gridSize;
  const cells: ("empty" | "pellet")[] = new Array(total).fill("empty");
  const center = Math.floor(gridSize / 2);
  const robotIdx = center * gridSize + center;

  const placed = new Set<number>();
  while (placed.size < TARGET_PELLETS) {
    const idx = Math.floor(Math.random() * total);
    // Keep pellets away from the robot start and edges
    const row = Math.floor(idx / gridSize);
    const col = idx % gridSize;
    const dist = Math.abs(row - center) + Math.abs(col - center);
    if (dist >= 2 && idx !== robotIdx) placed.add(idx);
  }
  placed.forEach((i) => { cells[i] = "pellet"; });

  return { cells, robotStart: { row: center, col: center } };
}

function moveGhost(g: Ghost, robot: { row: number; col: number }, gridSize: number): Ghost {
  const dr = robot.row - g.row;
  const dc = robot.col - g.col;
  if (dr === 0 && dc === 0) return g;
  let newRow = g.row;
  let newCol = g.col;
  if (Math.abs(dr) >= Math.abs(dc)) {
    newRow = g.row + Math.sign(dr);
  } else {
    newCol = g.col + Math.sign(dc);
  }
  newRow = Math.max(0, Math.min(gridSize - 1, newRow));
  newCol = Math.max(0, Math.min(gridSize - 1, newCol));
  return { ...g, row: newRow, col: newCol };
}

interface Props {
  gameLevel: number;
  questions?: RobocodyQuestion[];
  onComplete: (result: MiniGameResult) => void;
}

export default function RoboCody({ gameLevel, onComplete }: Props) {
  const level = Math.min(5, Math.max(1, gameLevel));
  const gridSize = GRID_SIZES[level];
  const cellSize = CELL_SIZES[gridSize];

  const [cells, setCells] = useState<("empty" | "pellet")[]>([]);
  const [robot, setRobot] = useState({ row: 0, col: 0 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [pelletsEaten, setPelletsEaten] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");

  const scoreRef = useRef(0);
  const pelletsRef = useRef(0);
  const doneRef = useRef(false);
  const robotRef = useRef({ row: 0, col: 0 });
  const cellsRef = useRef<("empty" | "pellet")[]>([]);

  // Init grid
  useEffect(() => {
    const { cells: c, robotStart } = buildGrid(gridSize);
    cellsRef.current = c;
    setCells(c);
    setRobot(robotStart);
    robotRef.current = robotStart;
  }, [gridSize]);

  function eatPellet(idx: number) {
    if (cellsRef.current[idx] !== "pellet") return;
    const next = [...cellsRef.current];
    next[idx] = "empty";
    cellsRef.current = next;
    setCells(next);

    const newPellets = pelletsRef.current + 1;
    pelletsRef.current = newPellets;
    scoreRef.current += 20;
    setPelletsEaten(newPellets);
    setScore(scoreRef.current);

    if (newPellets === 3) {
      setGhosts((prev) => {
        if (prev.length > 0) return prev;
        const gc = GHOST_COUNTS[level];
        const corners = [
          { id: 0, row: 0, col: 0 },
          { id: 1, row: 0, col: gridSize - 1 },
          { id: 2, row: gridSize - 1, col: 0 },
          { id: 3, row: gridSize - 1, col: gridSize - 1 },
        ];
        return corners.slice(0, gc);
      });
    }

    if (newPellets >= TARGET_PELLETS && !doneRef.current) {
      doneRef.current = true;
      setGameState("won");
      setTimeout(() => {
        onComplete({ finalScore: scoreRef.current, level, gameType: "robocody", completed: true });
      }, 1500);
    }
  }

  // Keyboard movement
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      const dirs: Record<string, { dr: number; dc: number }> = {
        ArrowUp: { dr: -1, dc: 0 }, w: { dr: -1, dc: 0 },
        ArrowDown: { dr: 1, dc: 0 }, s: { dr: 1, dc: 0 },
        ArrowLeft: { dr: 0, dc: -1 }, a: { dr: 0, dc: -1 },
        ArrowRight: { dr: 0, dc: 1 }, d: { dr: 0, dc: 1 },
      };
      const dir = dirs[e.key];
      if (!dir) return;
      e.preventDefault();

      setRobot((prev) => {
        const nr = Math.max(0, Math.min(gridSize - 1, prev.row + dir.dr));
        const nc = Math.max(0, Math.min(gridSize - 1, prev.col + dir.dc));
        if (nr === prev.row && nc === prev.col) return prev;
        robotRef.current = { row: nr, col: nc };
        const idx = nr * gridSize + nc;
        if (cellsRef.current[idx] === "pellet") eatPellet(idx);
        return { row: nr, col: nc };
      });
    },
    [gameState, gridSize]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Ghost movement
  useEffect(() => {
    if (gameState !== "playing" || ghosts.length === 0) return;
    const id = setInterval(() => {
      setGhosts((prev) => prev.map((g) => moveGhost(g, robotRef.current, gridSize)));
    }, GHOST_SPEEDS[level]);
    return () => clearInterval(id);
  }, [gameState, ghosts.length, level, gridSize]);

  // Collision detection
  useEffect(() => {
    if (gameState !== "playing" || ghosts.length === 0) return;
    const hit = ghosts.some((g) => g.row === robot.row && g.col === robot.col);
    if (hit) {
      setGameState("dead");
      if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(() => {
          onComplete({ finalScore: scoreRef.current, level, gameType: "robocody", completed: false });
        }, 1800);
      }
    }
  }, [robot, ghosts, gameState, level, onComplete]);

  // D-pad move handler (mobile)
  function dpadMove(dr: number, dc: number) {
    if (gameState !== "playing") return;
    setRobot((prev) => {
      const nr = Math.max(0, Math.min(gridSize - 1, prev.row + dr));
      const nc = Math.max(0, Math.min(gridSize - 1, prev.col + dc));
      if (nr === prev.row && nc === prev.col) return prev;
      robotRef.current = { row: nr, col: nc };
      const idx = nr * gridSize + nc;
      if (cellsRef.current[idx] === "pellet") eatPellet(idx);
      return { row: nr, col: nc };
    });
  }

  const gridPx = gridSize * cellSize;

  if (cells.length === 0) return null;

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ background: "#05050f", minHeight: 500, padding: "8px 0" }}
    >
      {/* HUD */}
      <div
        className="w-full flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 18, color: "var(--brand-tertiary)" }}>
          {score} PTS
        </span>
        <span style={{ fontFamily: "var(--font-fira)", fontSize: 12, color: "var(--text-muted)" }}>
          {pelletsEaten < 3 ? `Ghosts in ${3 - pelletsEaten} 👻` : `LVL ${level}`}
        </span>
        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 18, color: "var(--brand-primary)" }}>
          {pelletsEaten} / {TARGET_PELLETS}
        </span>
      </div>

      {/* Grid */}
      <div className="relative mt-2" style={{ width: gridPx, height: gridPx }}>
        {/* Cells */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            width: gridPx,
            height: gridPx,
            border: "2px solid rgba(0,220,222,0.15)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {cells.map((cell, idx) => {
            const row = Math.floor(idx / gridSize);
            const col = idx % gridSize;
            const isRobot = robot.row === row && robot.col === col;
            const isGhost = ghosts.some((g) => g.row === row && g.col === col);
            const ghostIdx = ghosts.findIndex((g) => g.row === row && g.col === col);

            return (
              <div
                key={idx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: (row + col) % 2 === 0 ? "rgba(0,220,222,0.03)" : "rgba(255,255,255,0.02)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Pellet */}
                {cell === "pellet" && !isRobot && !isGhost && (
                  <div
                    style={{
                      width: cellSize * 0.28,
                      height: cellSize * 0.28,
                      borderRadius: "50%",
                      background: "var(--brand-primary)",
                      boxShadow: "0 0 6px var(--brand-primary)",
                    }}
                  />
                )}

                {/* Robot */}
                {isRobot && (
                  <span
                    style={{
                      fontSize: cellSize * 0.7,
                      lineHeight: 1,
                      filter: gameState === "dead" ? "grayscale(1) opacity(0.4)" : "none",
                      transition: "filter 0.3s",
                    }}
                  >
                    🤖
                  </span>
                )}

                {/* Ghost */}
                {isGhost && !isRobot && (
                  <span
                    style={{
                      fontSize: cellSize * 0.65,
                      lineHeight: 1,
                      animation: "ghost-pulse 1s ease-in-out infinite",
                      filter: `drop-shadow(0 0 4px ${GHOST_COLORS[ghostIdx % GHOST_COLORS.length]})`,
                    }}
                  >
                    👻
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Game over overlay */}
        {gameState === "dead" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
            style={{ background: "rgba(255,50,50,0.15)", backdropFilter: "blur(2px)", zIndex: 30 }}
          >
            <p style={{ fontFamily: "var(--font-bebas)", fontSize: 36, color: "#ff4444", lineHeight: 1 }}>
              CAUGHT!
            </p>
            <p style={{ fontFamily: "var(--font-fira)", fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {score} pts earned
            </p>
          </div>
        )}

        {/* Win overlay */}
        {gameState === "won" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
            style={{ background: "rgba(0,220,222,0.12)", backdropFilter: "blur(2px)", zIndex: 30 }}
          >
            <p className="text-4xl" style={{ lineHeight: 1 }}>🎉</p>
            <p style={{ fontFamily: "var(--font-bebas)", fontSize: 36, color: "var(--brand-primary)", lineHeight: 1.1 }}>
              Escaped!
            </p>
            <p style={{ fontFamily: "var(--font-fira)", fontSize: 13, color: "var(--brand-tertiary)", marginTop: 4 }}>
              +{score} pts
            </p>
          </div>
        )}
      </div>

      {/* D-pad (mobile) */}
      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: "repeat(3, 44px)", gridTemplateRows: "repeat(3, 44px)" }}>
        {[
          [null, { dr: -1, dc: 0, icon: "▲" }, null],
          [{ dr: 0, dc: -1, icon: "◀" }, null, { dr: 0, dc: 1, icon: "▶" }],
          [null, { dr: 1, dc: 0, icon: "▼" }, null],
        ].map((row, ri) =>
          row.map((btn, ci) =>
            btn ? (
              <button
                key={`${ri}-${ci}`}
                onPointerDown={(e) => { e.preventDefault(); dpadMove(btn.dr, btn.dc); }}
                className="rounded-lg flex items-center justify-center font-bold text-sm active:scale-95"
                style={{
                  background: "rgba(0,220,222,0.1)",
                  border: "1px solid rgba(0,220,222,0.25)",
                  color: "var(--brand-primary)",
                  cursor: "pointer",
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                {btn.icon}
              </button>
            ) : (
              <div key={`${ri}-${ci}`} />
            )
          )
        )}
      </div>

    </div>
  );
}
