import { auth } from "@/lib/auth";
import { getSessionByCode, getPlayersInSession } from "@/lib/db/sessions";
import { getQuizById } from "@/lib/db/quizzes";
import { redirect, notFound } from "next/navigation";
import GameHost from "@/components/ui/GameHost";

export default async function HostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const authSession = await auth();
  if (!authSession?.user) redirect("/login");

  const session = await getSessionByCode(code);
  if (!session || session.status === "finished") notFound();

  const quiz = await getQuizById(session.quiz_id);
  if (!quiz) notFound();

  const players = await getPlayersInSession(session.id);

  return (
    <GameHost
      code={code.toUpperCase()}
      quizTitle={quiz.title}
      questionCount={quiz.questions.length}
      initialPlayers={players.map((p) => p.nickname)}
      mode={session.mode}
      miniGameType={session.mini_game_type}
    />
  );
}
