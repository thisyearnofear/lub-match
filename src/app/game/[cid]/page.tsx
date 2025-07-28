import GameLoader from "@/components/GameLoader";

export default async function PlayGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ cid: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { cid } = await params;
  const { created } = await searchParams;
  
  return <GameLoader cid={cid} justCreated={!!created} />;
}
