import GamePlayer from "@/components/ui/GamePlayer";

export default async function PlayerGamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GamePlayer code={code.toUpperCase()} />;
}
