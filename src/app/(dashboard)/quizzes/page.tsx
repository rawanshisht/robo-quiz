import { getAllQuizzes } from "@/lib/db/quizzes";
import Link from "next/link";
import DeleteQuizButton from "./DeleteQuizButton";
import HostButton from "./HostButton";

export default async function QuizzesPage() {
  const quizzes = await getAllQuizzes();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1
            className="t-heading"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Quiz Library
          </h1>
          <p
            className="t-small mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {quizzes.length === 0
              ? "No quizzes yet"
              : `${quizzes.length} quiz${quizzes.length !== 1 ? "zes" : ""}`}
          </p>
        </div>

        <Link
          href="/quizzes/new"
          className="t-button uppercase flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
            color: "#09090f",
            fontFamily: "var(--font-syne)",
            boxShadow: "0 2px 16px rgba(0,220,222,0.25)",
          }}
        >
          <span className="text-base leading-none">+</span>
          New Quiz
        </Link>
      </div>

      {/* Empty state */}
      {quizzes.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed py-20 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-lg mb-1"
            style={{ fontFamily: "var(--font-syne)", color: "var(--text)" }}
          >
            Nothing here yet
          </p>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
          >
            Create your first quiz to get started
          </p>
          <Link
            href="/quizzes/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--brand-primary)", fontFamily: "var(--font-syne)" }}
          >
            Create a quiz →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="group flex items-center justify-between rounded-xl px-6 py-4 border transition-all hover:border-white/20"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <p
                  className="font-semibold text-base"
                  style={{ color: "var(--text)", fontFamily: "var(--font-syne)" }}
                >
                  {quiz.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    fontFamily: "var(--font-fira)",
                    color: "var(--text-muted)",
                  }}
                >
                  {new Date(quiz.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <HostButton quizId={quiz.id} />
                <Link
                  href={`/quizzes/${quiz.id}/edit`}
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all hover:bg-white/5 active:scale-95"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  Edit
                </Link>
                <DeleteQuizButton id={quiz.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
