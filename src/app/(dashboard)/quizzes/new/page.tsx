import QuizBuilder from "@/components/ui/QuizBuilder";
import Link from "next/link";

export default function NewQuizPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/quizzes"
          className="text-sm font-medium transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-syne)" }}
        >
          ← Back
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <h1
          className="leading-none"
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2rem",
            letterSpacing: "0.06em",
            color: "var(--text)",
          }}
        >
          New Quiz
        </h1>
      </div>
      <QuizBuilder />
    </div>
  );
}
