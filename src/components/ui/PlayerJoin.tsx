"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerJoin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const upperCode = code.trim().toUpperCase();

    try {
      const checkRes = await fetch(`/api/sessions/${upperCode}`);
      if (!checkRes.ok) {
        setError("Room not found. Check the code and try again.");
        return;
      }

      const joinRes = await fetch(`/api/sessions/${upperCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!joinRes.ok) {
        const data = await joinRes.json();
        setError(data.error ?? "Failed to join. Try again.");
        return;
      }

      const { player_id } = await joinRes.json();
      localStorage.setItem(
        `roboquiz_${upperCode}`,
        JSON.stringify({ player_id, nickname: nickname.trim() })
      );
      router.push(`/play/${upperCode}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const isReady = code.length === 6 && nickname.trim().length > 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--player-bg)" }}
    >
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="text-5xl mb-3" style={{ lineHeight: 1 }}>
            🤖
          </div>
          <h1
            className="leading-none tracking-wide"
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "4.5rem",
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            RoboQuiz
          </h1>
          <p
            className="mt-2 text-xs uppercase tracking-[0.25em]"
            style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
          >
            Enter your room code to play
          </p>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          {/* Room code */}
          <input
            type="text"
            placeholder="XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
            className="w-full rounded-2xl text-center text-4xl font-black tracking-[0.35em] py-5 outline-none transition-all border-2 placeholder:opacity-15"
            style={{
              fontFamily: "var(--font-fira)",
              background: "rgba(0,220,222,0.07)",
              borderColor:
                code.length === 6
                  ? "var(--brand-primary)"
                  : "rgba(0,220,222,0.2)",
              color: "var(--brand-primary)",
              caretColor: "var(--brand-primary)",
              boxShadow:
                code.length === 6
                  ? "0 0 28px rgba(0,220,222,0.28)"
                  : "none",
            }}
          />

          {/* Nickname */}
          <input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            required
            className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold text-white outline-none transition-all border"
            style={{
              fontFamily: "var(--font-syne)",
              background: "rgba(255,0,191,0.07)",
              borderColor: "rgba(255,0,191,0.22)",
              caretColor: "var(--brand-secondary)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--brand-secondary)";
              e.target.style.boxShadow = "0 0 18px rgba(255,0,191,0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,0,191,0.22)";
              e.target.style.boxShadow = "none";
            }}
          />

          {error && (
            <p
              className="text-center text-sm font-semibold"
              style={{ color: "var(--brand-tertiary)", fontFamily: "var(--font-syne)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isReady}
            className="w-full rounded-2xl py-4 text-base font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: isReady
                ? "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)"
                : "rgba(255,255,255,0.08)",
              color: "#09090f",
              fontFamily: "var(--font-syne)",
              boxShadow: isReady
                ? "0 4px 28px rgba(0,220,222,0.3)"
                : "none",
            }}
          >
            {loading ? "Joining…" : "Let's Play! →"}
          </button>
        </form>
      </div>
    </div>
  );
}
