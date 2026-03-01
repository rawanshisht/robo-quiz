import QuizBuilder from "@/components/ui/QuizBuilder";
import Link from "next/link";

export default function NewQuizPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/quizzes" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Quiz</h1>
      </div>
      <QuizBuilder />
    </div>
  );
}
