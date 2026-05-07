"use client";

import { useState, useEffect, useRef } from "react";
import type { MiniGameResult } from "@/types";

interface Equation {
  id: number;
  expression: string;
  answer: number;
  x: number;
  y: number;
  color: string;
  exploding: boolean;
  shaking: boolean;
}

const EQUATIONS: Record<number, Array<{ expression: string; answer: number }>> = {
  1: [
    { expression: "3 + 4", answer: 7 }, { expression: "8 − 5", answer: 3 },
    { expression: "6 + 2", answer: 8 }, { expression: "9 − 3", answer: 6 },
    { expression: "4 + 5", answer: 9 }, { expression: "7 − 4", answer: 3 },
    { expression: "2 + 6", answer: 8 }, { expression: "10 − 4", answer: 6 },
    { expression: "5 + 3", answer: 8 }, { expression: "11 − 7", answer: 4 },
    { expression: "3 + 8", answer: 11 }, { expression: "12 − 4", answer: 8 },
    { expression: "7 + 5", answer: 12 }, { expression: "6 + 7", answer: 13 },
    { expression: "14 − 8", answer: 6 }, { expression: "4 + 9", answer: 13 },
  ],
  2: [
    { expression: "15 + 8", answer: 23 }, { expression: "24 − 9", answer: 15 },
    { expression: "7 × 3", answer: 21 }, { expression: "4 × 6", answer: 24 },
    { expression: "36 − 17", answer: 19 }, { expression: "28 + 14", answer: 42 },
    { expression: "5 × 8", answer: 40 }, { expression: "45 − 18", answer: 27 },
    { expression: "6 × 4", answer: 24 }, { expression: "9 × 3", answer: 27 },
    { expression: "52 − 27", answer: 25 }, { expression: "7 × 4", answer: 28 },
    { expression: "8 × 5", answer: 40 }, { expression: "60 − 34", answer: 26 },
    { expression: "6 × 7", answer: 42 }, { expression: "9 × 4", answer: 36 },
  ],
  3: [
    { expression: "6 × 7", answer: 42 }, { expression: "56 ÷ 8", answer: 7 },
    { expression: "9 × 8", answer: 72 }, { expression: "63 ÷ 7", answer: 9 },
    { expression: "7 × 11", answer: 77 }, { expression: "84 ÷ 12", answer: 7 },
    { expression: "8 × 9", answer: 72 }, { expression: "96 ÷ 8", answer: 12 },
    { expression: "11 × 9", answer: 99 }, { expression: "108 ÷ 9", answer: 12 },
    { expression: "12 × 8", answer: 96 }, { expression: "72 ÷ 6", answer: 12 },
    { expression: "7 × 12", answer: 84 }, { expression: "9 × 11", answer: 99 },
    { expression: "48 ÷ 4", answer: 12 }, { expression: "8 × 11", answer: 88 },
  ],
  4: [
    { expression: "13 × 8", answer: 104 }, { expression: "144 ÷ 12", answer: 12 },
    { expression: "17 × 6", answer: 102 }, { expression: "15 × 9", answer: 135 },
    { expression: "196 ÷ 14", answer: 14 }, { expression: "19 × 7", answer: 133 },
    { expression: "14 × 12", answer: 168 }, { expression: "16 × 11", answer: 176 },
    { expression: "23 × 8", answer: 184 }, { expression: "256 ÷ 16", answer: 16 },
    { expression: "18 × 13", answer: 234 }, { expression: "22 × 9", answer: 198 },
    { expression: "225 ÷ 15", answer: 15 }, { expression: "17 × 14", answer: 238 },
    { expression: "400 ÷ 20", answer: 20 }, { expression: "289 ÷ 17", answer: 17 },
  ],
  5: [
    { expression: "12²", answer: 144 }, { expression: "7 × 15", answer: 105 },
    { expression: "13²", answer: 169 }, { expression: "8 × 17", answer: 136 },
    { expression: "15²", answer: 225 }, { expression: "19 × 9", answer: 171 },
    { expression: "24 × 12", answer: 288 }, { expression: "√196", answer: 14 },
    { expression: "18 × 16", answer: 288 }, { expression: "√256", answer: 16 },
    { expression: "25 × 13", answer: 325 }, { expression: "√324", answer: 18 },
    { expression: "17 × 18", answer: 306 }, { expression: "√400", answer: 20 },
    { expression: "23 × 17", answer: 391 }, { expression: "21 × 19", answer: 399 },
  ],
};

const SPEEDS: Record<number, number> = { 1: 1.5, 2: 2.5, 3: 3.5, 4: 4.5, 5: 6 };
const COLORS = ["#00dcde", "#ff00bf", "#ff9752", "#a78bfa", "#34d399"];
const TARGET = 10;
const MAX_ON_SCREEN = 3;
const GAME_H = 360;
const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

let eid = 0;
function makeEq(level: number, y = -70): Equation {
  const pool = EQUATIONS[Math.min(5, Math.max(1, level))];
  const eq = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: ++eid,
    ...eq,
    x: 4 + Math.random() * 66,
    y,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    exploding: false,
    shaking: false,
  };
}

interface Props {
  gameLevel: number;
  onComplete: (result: MiniGameResult) => void;
}

export default function FlyingMath({ gameLevel, onComplete }: Props) {
  const level = Math.min(5, Math.max(1, gameLevel));
  const speed = SPEEDS[level];

  const [eqs, setEqs] = useState<Equation[]>(() => [
    makeEq(level, -70),
    makeEq(level, -200),
    makeEq(level, -360),
  ]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [inputShake, setInputShake] = useState(false);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const doneRef = useRef(false);
  const inputEl = useRef<HTMLInputElement>(null);

  // Game loop
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setEqs((prev) => {
        let next = prev.map((e) =>
          e.exploding || e.shaking ? e : { ...e, y: e.y + speed }
        );
        const fell = next.filter((e) => !e.exploding && !e.shaking && e.y > GAME_H);
        next = next.filter((e) => e.exploding || e.shaking || e.y <= GAME_H);
        fell.forEach(() => next.push(makeEq(level)));
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [done, speed, level]);

  function handleInput(val: string) {
    setInput(val);
    const num = parseFloat(val);
    if (isNaN(num) || val.trim() === "") return;

    const match = eqs.find((e) => !e.exploding && !e.shaking && e.answer === num);
    if (match) {
      correctRef.current++;
      scoreRef.current += 10;
      setCorrect(correctRef.current);
      setScore(scoreRef.current);
      setInput("");

      setEqs((prev) => prev.map((e) => (e.id === match.id ? { ...e, exploding: true } : e)));
      setTimeout(() => {
        setEqs((prev) => [...prev.filter((e) => e.id !== match.id), makeEq(level)]);
      }, 550);

      if (correctRef.current >= TARGET && !doneRef.current) {
        doneRef.current = true;
        setDone(true);
        setTimeout(() => {
          onComplete({ finalScore: scoreRef.current, level, gameType: "flying-math", completed: true });
        }, 900);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const num = parseFloat(input.trim());
    if (isNaN(num)) { setInput(""); return; }
    const match = eqs.find((eq) => !eq.exploding && !eq.shaking && eq.answer === num);
    if (!match) triggerWrong();
  }

  function triggerWrong() {
    setInput("");
    setInputShake(true);
    setTimeout(() => setInputShake(false), 500);
    setEqs((prev) => prev.map((e) => (!e.exploding ? { ...e, shaking: true } : e)));
    setTimeout(() => setEqs((prev) => prev.map((e) => ({ ...e, shaking: false }))), 500);
  }

  return (
    <div
      className="relative w-full flex flex-col select-none"
      style={{ height: GAME_H + 72, background: "#05050f", overflow: "hidden" }}
    >
      {/* HUD */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 }}
      >
        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 18, color: "var(--brand-tertiary)" }}>
          {score} PTS
        </span>
        <span style={{ fontFamily: "var(--font-fira)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          LVL {level}
        </span>
        <span style={{ fontFamily: "var(--font-bebas)", fontSize: 18, color: "var(--brand-primary)" }}>
          {correct} / {TARGET}
        </span>
      </div>

      {/* Falling area */}
      <div className="relative flex-1" style={{ height: GAME_H }}>
        {eqs.map((eq) => (
          <div
            key={eq.id}
            style={{
              position: "absolute",
              left: `${eq.x}%`,
              top: eq.y,
              animation: eq.exploding ? "eq-explode 0.5s forwards" : eq.shaking ? "eq-shake 0.4s" : "none",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div
              className="px-3 py-1.5 rounded-xl font-black border whitespace-nowrap"
              style={{
                background: `${eq.color}1a`,
                borderColor: eq.color,
                color: eq.color,
                fontFamily: "var(--font-fira)",
                fontSize: 17,
                boxShadow: `0 0 14px ${eq.color}33`,
              }}
            >
              {eq.expression} = ?
            </div>

            {eq.exploding &&
              PARTICLE_ANGLES.map((angle, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 7,
                    height: 7,
                    marginTop: -3.5,
                    marginLeft: -3.5,
                    borderRadius: "50%",
                    background: COLORS[i % COLORS.length],
                    animation: "particle-out 0.55s ease-out forwards",
                    "--pa": `${angle}deg`,
                  } as React.CSSProperties}
                />
              ))}
          </div>
        ))}

        {done && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(5,5,15,0.85)", zIndex: 20 }}
          >
            <div className="text-5xl mb-2" style={{ lineHeight: 1 }}>🎉</div>
            <p style={{ fontFamily: "var(--font-bebas)", fontSize: 44, color: "var(--brand-primary)", lineHeight: 1 }}>
              Cleared!
            </p>
            <p style={{ fontFamily: "var(--font-fira)", fontSize: 16, color: "var(--brand-tertiary)", marginTop: 6 }}>
              +{score} pts
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3" style={{ background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <input
          ref={inputEl}
          type="text"
          inputMode="numeric"
          pattern="[0-9\-]*"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={done}
          placeholder="Type answer…"
          autoFocus
          className="w-full rounded-xl px-4 py-2.5 text-center outline-none placeholder-white/30"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: `2px solid ${inputShake ? "var(--brand-secondary)" : "rgba(255,255,255,0.15)"}`,
            color: "#fff",
            caretColor: "var(--brand-primary)",
            fontFamily: "var(--font-fira)",
            fontSize: 20,
            animation: inputShake ? "eq-shake 0.4s" : "none",
            transition: "border-color 0.15s",
          }}
        />
      </div>
    </div>
  );
}
