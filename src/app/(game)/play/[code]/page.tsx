import { getSessionByCode } from "@/lib/db/sessions";
import GamePlayer from "@/components/ui/GamePlayer";

export default async function PlayerGamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getSessionByCode(code.toUpperCase());
  const mode = session?.mode ?? "classic";
  const miniGameType = session?.mini_game_type ?? null;
  return <GamePlayer code={code.toUpperCase()} mode={mode} miniGameType={miniGameType} />;
}
