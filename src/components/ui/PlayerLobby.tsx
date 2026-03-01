"use client";

interface Props {
  code: string;
  nickname: string;
  playerCount: number;
}

export default function PlayerLobby({ code, nickname, playerCount }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 text-2xl">
          ✓
        </div>
        <h1 className="text-3xl font-black mb-1">You&apos;re in!</h1>
        {nickname && (
          <p className="text-lg text-gray-400 mb-6">
            Playing as{" "}
            <span className="font-bold text-white">{nickname}</span>
          </p>
        )}

        <div className="rounded-xl bg-white/5 border border-white/10 px-10 py-5 mb-8">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
            Room
          </p>
          <p className="text-4xl font-black font-mono tracking-widest">{code}</p>
        </div>

        <p className="text-gray-500">
          Waiting for the host to start the game…
        </p>
        {playerCount > 0 && (
          <p className="mt-2 text-xs text-gray-600">
            {playerCount} player{playerCount !== 1 ? "s" : ""} in lobby
          </p>
        )}
      </div>
    </div>
  );
}
