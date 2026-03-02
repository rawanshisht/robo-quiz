import { getQuizById } from "@/lib/db/quizzes";
import { notFound } from "next/navigation";
import QuizBuilder from "@/components/ui/QuizBuilder";
import Link from "next/link";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizById(id);
  if (!quiz) notFound();

  const initialQuestions = quiz.questions.map((q) => ({
    type: q.type,
    text: q.text,
    image_url: q.image_url,
    options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
  }));

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
          Edit Quiz
        </h1>
      </div>
      <QuizBuilder
        quizId={id}
        initialTitle={quiz.title}
        initialQuestions={initialQuestions}
      />
    </div>
  );
}
