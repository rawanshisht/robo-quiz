"use client";

interface Props {
  code: string;
  nickname: string;
  playerCount: number;
}

export default function PlayerLobby({ code, nickname, playerCount }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-white"
      style={{ background: "var(--player-bg)" }}
    >
      <div className="text-center w-full max-w-xs">
        {/* Animated checkmark */}
        <div className="relative mb-8 mx-auto" style={{ width: 96, height: 96 }}>
          {/* Pulse rings */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid var(--brand-primary)",
              animation: "pulse-ring 2s ease-out 0s infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "2px solid var(--brand-primary)",
              animation: "pulse-ring 2s ease-out 0.7s infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center text-3xl font-black border-2"
            style={{
              borderColor: "var(--brand-primary)",
              background: "rgba(0,220,222,0.12)",
              color: "var(--brand-primary)",
              boxShadow: "0 0 32px rgba(0,220,222,0.28)",
              animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            ✓
          </div>
        </div>

        <h1
          className="t-title mb-2"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          You&apos;re In!
        </h1>

        {nickname && (
          <p
            className="text-sm mb-8 font-medium"
            style={{ color: "#6b7280", fontFamily: "var(--font-syne)" }}
          >
            Playing as{" "}
            <span
              className="font-black"
              style={{
                color: "var(--brand-secondary)",
                fontFamily: "var(--font-fira)",
              }}
            >
              {nickname}
            </span>
          </p>
        )}

        {/* Room code card */}
        <div
          className="rounded-2xl py-5 px-8 mb-8 border"
          style={{
            background: "rgba(255,151,82,0.08)",
            borderColor: "rgba(255,151,82,0.28)",
          }}
        >
          <p
            className="text-xs uppercase tracking-[0.2em] mb-2"
            style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
          >
            Room Code
          </p>
          <p
            className="text-5xl tracking-[0.25em]"
            style={{
              fontFamily: "var(--font-fira)",
              color: "var(--brand-tertiary)",
            }}
          >
            {code}
          </p>
        </div>

        {/* Waiting indicator */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: "var(--brand-primary)",
                  animation: `pulse-dot 1.4s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            className="text-sm"
            style={{ color: "#4a4a5a", fontFamily: "var(--font-syne)" }}
          >
            Waiting for the host to start…
          </p>
          {playerCount > 0 && (
            <p
              className="text-xs"
              style={{ color: "#374151", fontFamily: "var(--font-syne)" }}
            >
              {playerCount} player{playerCount !== 1 ? "s" : ""} in lobby
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
