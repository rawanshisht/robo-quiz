"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/quizzes");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10">
          <div className="text-3xl mb-2" style={{ lineHeight: 1 }}>🤖</div>
          <h1
            className="t-title mb-3"
            style={{
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
            className="t-small"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in to manage your quizzes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border"
              style={{
                background: "rgba(0,220,222,0.06)",
                borderColor: "rgba(0,220,222,0.18)",
                color: "var(--text)",
                fontFamily: "var(--font-syne)",
                caretColor: "var(--brand-primary)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--brand-primary)";
                e.target.style.boxShadow = "0 0 16px rgba(0,220,222,0.18)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,220,222,0.18)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border"
              style={{
                background: "rgba(255,0,191,0.06)",
                borderColor: "rgba(255,0,191,0.18)",
                color: "var(--text)",
                fontFamily: "var(--font-syne)",
                caretColor: "var(--brand-secondary)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--brand-secondary)";
                e.target.style.boxShadow = "0 0 16px rgba(255,0,191,0.18)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,0,191,0.18)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <p
              className="text-sm font-medium"
              style={{ color: "var(--brand-tertiary)", fontFamily: "var(--font-syne)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="t-button uppercase mt-1 w-full rounded-xl py-3.5 transition-all hover:opacity-90 disabled:opacity-40 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              color: "#09090f",
              boxShadow: "0 4px 20px rgba(0,220,222,0.25)",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
