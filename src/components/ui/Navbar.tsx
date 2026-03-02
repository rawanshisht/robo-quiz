"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Navbar({ userName }: { userName: string }) {
  return (
    <nav
      style={{
        background: "rgba(9,9,15,0.85)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link
          href="/quizzes"
          className="t-heading leading-none transition-opacity hover:opacity-80"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          RoboQuiz
        </Link>

        <div className="flex items-center gap-5">
          <span
            className="text-sm hidden sm:block"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            {userName}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-semibold px-4 py-2 rounded-lg border transition-all hover:bg-white/5 active:scale-95"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-syne)",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
