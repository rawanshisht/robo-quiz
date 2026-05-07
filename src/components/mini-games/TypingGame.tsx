"use client";

import { useState, useEffect, useRef } from "react";
import type { MiniGameResult } from "@/types";

interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
  color: string;
  clearing: boolean;
  shaking: boolean;
}

const WORDS: Record<number, string[]> = {
  1: ["cat", "dog", "run", "fun", "hat", "sun", "top", "cup", "red", "big", "fly", "map", "log", "bus", "hop", "pit"],
  2: ["apple", "happy", "cloud", "brave", "pizza", "green", "dance", "flame", "storm", "light", "brush", "chair", "smile", "plant", "prize", "fresh"],
  3: ["rocket", "wonder", "flower", "bridge", "jungle", "castle", "frozen", "market", "planet", "school", "window", "pencil", "rabbit", "orange", "basket", "purple"],
  4: ["explore", "journey", "monster", "picture", "science", "capture", "thunder", "blanket", "compass", "dolphin", "fantasy", "gravity", "history", "morning", "stadium", "weather"],
  5: ["adventure", "beautiful", "champion", "dinosaur", "elephant", "fantastic", "geography", "knowledge", "language", "mountains", "notebook", "passport", "umbrella", "wonderful", "computer", "surprise"],
};

const SPEEDS: Record<number, number> = { 1: 1.2, 2: 2, 3: 3, 4: 4.2, 5: 5.5 };
const COLORS = ["#00dcde", "#ff00bf", "#ff9752", "#a78bfa", "#34d399", "#fb923c"];
const TARGET = 12;
const MAX_ON_SCREEN = 3;
const GAME_H = 360;

let wid = 0;
function makeWord(level: number, y = -50): FallingWord {
  const pool = WORDS[Math.min(5, Math.max(1, level))];
  return {
    id: ++wid,
    word: pool[Math.floor(Math.random() * pool.length)],
    x: 4 + Math.random() * 66,
    y,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    clearing: false,
    shaking: false,
  };
}

interface Props {
  gameLevel: number;
  onComplete: (result: MiniGameResult) => void;
}

export default function TypingGame({ gameLevel, onComplete }: Props) {
  const level = Math.min(5, Math.max(1, gameLevel));
  const speed = SPEEDS[level];

  const [words, setWords] = useState<FallingWord[]>(() => [
    makeWord(level, -50),
    makeWord(level, -190),
    makeWord(level, -340),
  ]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const doneRef = useRef(false);

  // Game loop
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setWords((prev) => {
        let next = prev.map((w) =>
          w.clearing || w.shaking ? w : { ...w, y: w.y + speed }
        );
        const fell = next.filter((w) => !w.clearing && !w.shaking && w.y > GAME_H);
        next = next.filter((w) => w.clearing || w.shaking || w.y <= GAME_H);
        fell.forEach(() => next.push(makeWord(level)));
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [done, speed, level]);

  function handleInput(val: string) {
    setInput(val);
    const typed = val.toLowerCase().trim();
    if (!typed) return;

    const match = words.find(
      (w) => !w.clearing && !w.shaking && w.word.toLowerCase() === typed
    );
    if (match) {
      correctRef.current++;
      scoreRef.current += 5;
      setCorrect(correctRef.current);
      setScore(scoreRef.current);
      setInput("");

      setWords((prev) => prev.map((w) => (w.id === match.id ? { ...w, clearing: true } : w)));
      setTimeout(() => {
        setWords((prev) => [...prev.filter((w) => w.id !== match.id), makeWord(level)]);
      }, 400);

      if (correctRef.current >= TARGET && !doneRef.current) {
        doneRef.current = true;
        setDone(true);
        setTimeout(() => {
          onComplete({ finalScore: scoreRef.current, level, gameType: "typing", completed: true });
        }, 900);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const typed = input.toLowerCase().trim();
    if (!typed) return;
    const match = words.find((w) => !w.clearing && !w.shaking && w.word.toLowerCase() === typed);
    if (!match) {
      setInput("");
      setWords((prev) => prev.map((w) => (!w.clearing ? { ...w, shaking: true } : w)));
      setTimeout(() => setWords((prev) => prev.map((w) => ({ ...w, shaking: false }))), 500);
    }
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
        {words.map((w) => (
          <div
            key={w.id}
            style={{
              position: "absolute",
              left: `${w.x}%`,
              top: w.y,
              animation: w.clearing
                ? "word-clear 0.4s forwards"
                : w.shaking
                  ? "eq-shake 0.4s"
                  : "none",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            {w.word.split("").map((ch, i) => {
              const typedLower = input.toLowerCase();
              const isTyped = i < typedLower.length && ch === typedLower[i];
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: "var(--font-fira)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: isTyped ? "#ffffff" : w.color,
                    textShadow: isTyped ? `0 0 10px #ffffff88` : `0 0 10px ${w.color}55`,
                    transition: "color 0.1s",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}

        {done && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(5,5,15,0.85)", zIndex: 20 }}
          >
            <div className="text-5xl mb-2" style={{ lineHeight: 1 }}>⌨️</div>
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
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={done}
          placeholder="Type the word…"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl px-4 py-2.5 text-center outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "2px solid rgba(255,255,255,0.1)",
            color: "var(--text)",
            fontFamily: "var(--font-fira)",
            fontSize: 20,
          }}
        />
      </div>
    </div>
  );
}
