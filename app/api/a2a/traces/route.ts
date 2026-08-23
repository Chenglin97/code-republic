import { a2aTraceStorage } from "@/lib/a2a/trace-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const worldId = url.searchParams.get("worldId") ?? "demo";
  const requestedLimit = Number(url.searchParams.get("limit") ?? 100);
  const limit = Number.isSafeInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;

  if (!/^[a-z0-9_-]{1,80}$/i.test(worldId)) {
    return Response.json({ error: { code: "INVALID_WORLD_ID", message: "The World ID is invalid." } }, { status: 400 });
  }

  const traces = await a2aTraceStorage().list(worldId, limit);
  return Response.json({
    traces,
    telemetryContract: {
      runtimeMetadataKey: "code-republic.dev/runtime",
      usageMetadataKey: "code-republic.dev/usage",
      tokenCounts: "adapter-reported or caller-reported; never inferred",
      envelope: "normalized and allowlisted; arbitrary part content is not persisted",
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
