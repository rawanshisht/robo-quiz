"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MiniGameResult, RobocodyQuestion } from "@/types";

interface Ghost {
  id: number;
  row: number;
  col: number;
}

type GameState = "playing" | "won" | "dead";
type QuestionPhase = "reading" | "answering" | null;

const GRID_SIZES: Record<number, number> = { 1: 9, 2: 9, 3: 11, 4: 11, 5: 13 };
const GHOST_COUNTS: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 };
const GHOST_SPEEDS: Record<number, number> = { 1: 900, 2: 750, 3: 600, 4: 420, 5: 280 };
const CELL_SIZES: Record<number, number> = { 9: 34, 11: 28, 13: 24 };
const GHOST_COLORS = ["#ff4444", "#ff00bf", "#ff9752"];
const TARGET_PELLETS = 15;

const DEFAULT_QUESTIONS: RobocodyQuestion[] = [
  { id: "d1", text: "What is 5 + 3?", options: [{ id: "a", text: "7" }, { id: "b", text: "8" }, { id: "c", text: "9" }, { id: "d", text: "6" }], correctId: "b" },
  { id: "d2", text: "What is 6 × 4?", options: [{ id: "a", text: "20" }, { id: "b", text: "22" }, { id: "c", text: "24" }, { id: "d", text: "18" }], correctId: "c" },
  { id: "d3", text: "What is 15 − 7?", options: [{ id: "a", text: "8" }, { id: "b", text: "6" }, { id: "c", text: "9" }, { id: "d", text: "7" }], correctId: "a" },
  { id: "d4", text: "What is 9 × 3?", options: [{ id: "a", text: "21" }, { id: "b", text: "27" }, { id: "c", text: "24" }, { id: "d", text: "30" }], correctId: "b" },
  { id: "d5", text: "What is 36 ÷ 6?", options: [{ id: "a", text: "5" }, { id: "b", text: "7" }, { id: "c", text: "6" }, { id: "d", text: "4" }], correctId: "c" },
  { id: "d6", text: "What is 12 + 9?", options: [{ id: "a", text: "19" }, { id: "b", text: "22" }, { id: "c", text: "21" }, { id: "d", text: "20" }], correctId: "c" },
  { id: "d7", text: "What is 7 × 8?", options: [{ id: "a", text: "54" }, { id: "b", text: "56" }, { id: "c", text: "48" }, { id: "d", text: "63" }], correctId: "b" },
  { id: "d8", text: "What is 100 − 37?", options: [{ id: "a", text: "63" }, { id: "b", text: "67" }, { id: "c", text: "73" }, { id: "d", text: "57" }], correctId: "a" },
];

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

export default function RoboCody({ gameLevel, questions, onComplete }: Props) {
  const level = Math.min(5, Math.max(1, gameLevel));
  const gridSize = GRID_SIZES[level];
  const cellSize = CELL_SIZES[gridSize];
  const questionPool = (questions && questions.length > 0 ? questions : DEFAULT_QUESTIONS);

  const [cells, setCells] = useState<("empty" | "pellet")[]>([]);
  const [robot, setRobot] = useState({ row: 0, col: 0 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [pelletsEaten, setPelletsEaten] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [currentQuestion, setCurrentQuestion] = useState<RobocodyQuestion | null>(null);
  const [currentPelletIdx, setCurrentPelletIdx] = useState<number | null>(null);
  const [questionPhase, setQuestionPhase] = useState<QuestionPhase>(null);
  const [wrongFlash, setWrongFlash] = useState(false);

  const scoreRef = useRef(0);
  const pelletsRef = useRef(0);
  const doneRef = useRef(false);
  const robotRef = useRef({ row: 0, col: 0 });
  const questionsUsedRef = useRef<Set<string>>(new Set());

  // Init grid
  useEffect(() => {
    const { cells: c, robotStart } = buildGrid(gridSize);
    setCells(c);
    setRobot(robotStart);
    robotRef.current = robotStart;
  }, [gridSize]);

  function getNextQuestion(): RobocodyQuestion {
    const unused = questionPool.filter((q) => !questionsUsedRef.current.has(q.id));
    const pool = unused.length > 0 ? unused : questionPool;
    if (unused.length === 0) questionsUsedRef.current.clear();
    const q = pool[Math.floor(Math.random() * pool.length)];
    questionsUsedRef.current.add(q.id);
    return q;
  }

  // Keyboard movement
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== "playing" || questionPhase !== null) return;
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
        setCells((c) => {
          if (c[idx] === "pellet") {
            const q = getNextQuestion();
            setCurrentPelletIdx(idx);
            setCurrentQuestion(q);
            setQuestionPhase("reading");
            setTimeout(() => setQuestionPhase("answering"), 1600);
          }
          return c;
        });
        return { row: nr, col: nc };
      });
    },
    [gameState, questionPhase, gridSize]
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
    if (gameState !== "playing" || questionPhase !== null) return;
    setRobot((prev) => {
      const nr = Math.max(0, Math.min(gridSize - 1, prev.row + dr));
      const nc = Math.max(0, Math.min(gridSize - 1, prev.col + dc));
      if (nr === prev.row && nc === prev.col) return prev;
      robotRef.current = { row: nr, col: nc };

      const idx = nr * gridSize + nc;
      setCells((c) => {
        if (c[idx] === "pellet") {
          const q = getNextQuestion();
          setCurrentPelletIdx(idx);
          setCurrentQuestion(q);
          setQuestionPhase("reading");
          setTimeout(() => setQuestionPhase("answering"), 1600);
        }
        return c;
      });
      return { row: nr, col: nc };
    });
  }

  function handleAnswer(optionId: string) {
    if (!currentQuestion || questionPhase !== "answering") return;

    if (optionId === currentQuestion.correctId) {
      // Correct
      setCells((prev) => {
        const next = [...prev];
        if (currentPelletIdx !== null) next[currentPelletIdx] = "empty";
        return next;
      });
      const newPellets = pelletsRef.current + 1;
      pelletsRef.current = newPellets;
      scoreRef.current += 20;
      setPelletsEaten(newPellets);
      setScore(scoreRef.current);
      setCurrentQuestion(null);
      setCurrentPelletIdx(null);
      setQuestionPhase(null);

      // Spawn ghosts after 3 pellets
      if (newPellets === 3 && ghosts.length === 0) {
        const gc = GHOST_COUNTS[level];
        const corners = [
          { id: 0, row: 0, col: 0 },
          { id: 1, row: 0, col: gridSize - 1 },
          { id: 2, row: gridSize - 1, col: 0 },
          { id: 3, row: gridSize - 1, col: gridSize - 1 },
        ];
        setGhosts(corners.slice(0, gc));
      }

      if (newPellets >= TARGET_PELLETS && !doneRef.current) {
        doneRef.current = true;
        setGameState("won");
        setTimeout(() => {
          onComplete({ finalScore: scoreRef.current, level, gameType: "robocody", completed: true });
        }, 1500);
      }
    } else {
      // Wrong — repeat question
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 600);
      setQuestionPhase("reading");
      setTimeout(() => setQuestionPhase("answering"), 1600);
    }
  }

  const gridPx = gridSize * cellSize;
  const ABCD = ["A", "B", "C", "D"];

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

      {/* Question overlay */}
      {currentQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(5,5,15,0.92)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-4"
            style={{
              background: "#0f0f1a",
              borderColor: wrongFlash ? "var(--brand-secondary)" : "var(--brand-primary)",
              boxShadow: wrongFlash ? "0 0 30px rgba(255,0,191,0.3)" : "0 0 30px rgba(0,220,222,0.2)",
              animation: "question-pop 0.25s ease-out",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span
                style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: 14,
                  color: "var(--brand-primary)",
                  letterSpacing: "0.08em",
                }}
              >
                {questionPhase === "reading" ? "READ CAREFULLY…" : "CHOOSE AN ANSWER!"}
              </span>
            </div>

            <p
              className="text-center"
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: 17,
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.4,
              }}
            >
              {currentQuestion.text}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={questionPhase !== "answering"}
                  className="rounded-xl px-3 py-3 text-left transition-all active:scale-95 disabled:opacity-30"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: questionPhase === "answering" ? "pointer" : "default",
                  }}
                >
                  <span
                    className="font-black mr-2"
                    style={{ fontFamily: "var(--font-bebas)", color: "var(--brand-primary)", fontSize: 16 }}
                  >
                    {ABCD[i]}
                  </span>
                  <span style={{ fontFamily: "var(--font-syne)", fontSize: 13, color: "var(--text)" }}>
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>

            {wrongFlash && (
              <p
                className="text-center text-sm"
                style={{ fontFamily: "var(--font-syne)", color: "var(--brand-secondary)" }}
              >
                Try again!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
