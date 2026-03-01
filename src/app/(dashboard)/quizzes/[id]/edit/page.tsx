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
      <div className="mb-6 flex items-center gap-3">
        <Link href="/quizzes" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
      </div>
      <QuizBuilder
        quizId={id}
        initialTitle={quiz.title}
        initialQuestions={initialQuestions}
      />
    </div>
  );
}
