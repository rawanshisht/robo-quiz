"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Navbar({ userName }: { userName: string }) {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/quizzes" className="text-lg font-bold text-blue-600">
          RoboQuiz
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
