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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-white">RoboQuiz</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Enter the room code shown on screen
          </p>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="ROOM CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
            className="rounded-xl bg-white/10 border border-white/20 px-4 py-4 text-white text-center text-3xl font-black font-mono tracking-widest placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            required
            className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6 || !nickname.trim()}
            className="rounded-xl bg-blue-600 py-3 text-lg font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Joining…" : "Join Game"}
          </button>
        </form>
      </div>
    </div>
  );
}
