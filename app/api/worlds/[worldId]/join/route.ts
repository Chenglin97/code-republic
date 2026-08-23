import { NextResponse } from "next/server";
import { z } from "zod";
import { planAgentJoin, suggestFirstAction } from "@/lib/world/join";
import { appendDrafts } from "@/lib/world/store";
import { getWorldId, readJson, worldErrorResponse, type WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  inviteCode: z.string().min(4).max(80),
  displayName: z.string().trim().min(2).max(32),
  capabilities: z.array(z.string().trim().min(2).max(40)).min(1).max(4),
  idempotencyKey: z.string().min(4).max(180),
});

export async function POST(request: Request, context: WorldRouteContext) {
  try {
    const parsed = joinSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_JOIN", message: parsed.error.issues[0]?.message ?? "Invalid join request." } },
        { status: 400 },
      );
    }
    const configuredInvite = process.env.CODE_REPUBLIC_DEMO_INVITE_CODE;
    if (configuredInvite && parsed.data.inviteCode !== configuredInvite) {
      return NextResponse.json(
        { error: { code: "INVALID_INVITE", message: "The invite code is invalid." } },
        { status: 403 },
      );
    }

    const worldId = await getWorldId(context);
    const { agent, drafts } = planAgentJoin(worldId, parsed.data);
    const result = await appendDrafts(worldId, drafts, {
      idempotencyKey: parsed.data.idempotencyKey,
      idempotencyInput: parsed.data,
    });
    const joinedAgent = result.snapshot.agents.find((candidate) => candidate.id === agent.id) ?? agent;
    return NextResponse.json({
      ...result,
      agent: joinedAgent,
      firstActionEventId: result.eventIds[1] ?? null,
      suggestedAction: suggestFirstAction(result.snapshot, joinedAgent),
      snapshotUrl: `/api/worlds/${worldId}/snapshot`,
      eventsUrl: `/api/worlds/${worldId}/events?after=${result.worldVersion}`,
    });
  } catch (error) {
    return worldErrorResponse(error, "The Agent could not join this World.");
  }
}
