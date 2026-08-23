import { WorldApp } from "../ui/world-app";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ world?: string | string[] }> }) {
  const requested = (await searchParams).world;
  const worldId = typeof requested === "string" && /^[a-z0-9_-]{1,80}$/i.test(requested) ? requested : "demo";
  return <WorldApp initialView="agents" joinOnLoad worldId={worldId} />;
}
