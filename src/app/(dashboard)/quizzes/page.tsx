import { getAllQuizzes } from "@/lib/db/quizzes";
import Link from "next/link";
import DeleteQuizButton from "./DeleteQuizButton";
import HostButton from "./HostButton";

export default async function QuizzesPage() {
  const quizzes = await getAllQuizzes();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Library</h1>
        <Link
          href="/quizzes/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-400">No quizzes yet.</p>
          <Link
            href="/quizzes/new"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Create your first quiz
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{quiz.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(quiz.updated_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <HostButton quizId={quiz.id} />
                <Link
                  href={`/quizzes/${quiz.id}/edit`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
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
