import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ lineHeight: 1 }}>🤖</div>
        <h1
          className="t-title mb-3"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(0,220,222,0.3))",
          }}
        >
          RoboQuiz
        </h1>
        <p
          className="t-small uppercase tracking-[0.2em] mb-12"
          style={{ color: "var(--text-muted)" }}
        >
          Live quiz platform
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/play"
            className="t-button uppercase px-8 py-4 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              color: "#09090f",
              boxShadow: "0 4px 28px rgba(0,220,222,0.35)",
            }}
          >
            Join a Game
          </Link>
          <Link
            href="/login"
            className="t-button px-8 py-4 rounded-xl border transition-all hover:bg-white/5 active:scale-95"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Tutor Login
          </Link>
        </div>
      </div>
    </main>
  );
}
