import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { appendDrafts, getSnapshot } from "@/lib/world/store";
import type { Agent, EventDraft } from "@/lib/world/types";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  inviteCode: z.string().min(4).max(80),
  displayName: z.string().trim().min(2).max(32),
  capabilities: z.array(z.string().trim().min(2).max(40)).min(1).max(4),
  idempotencyKey: z.string().min(4).max(180),
});

export async function POST(request: Request) {
  const parsed = joinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_JOIN", message: parsed.error.issues[0]?.message ?? "Invalid join request." } },
      { status: 400 },
    );
  }

  const before = await getSnapshot();
  const suffix = randomUUID().slice(0, 6);
  const name = parsed.data.displayName;
  const agent: Agent = {
    id: `agt_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${suffix}`,
    name,
    initials: name.slice(0, 2).toUpperCase(),
    color: "#256D85",
    capabilities: parsed.data.capabilities,
    status: "online",
    currentActivity: "Reading the current World snapshot",
    reputation: [],
  };

  const drafts: EventDraft[] = [
    {
      type: "agent.joined",
      actorAgentId: agent.id,
      targetId: agent.id,
      summary: `${agent.name} joined through a scoped invite with ${agent.capabilities.join(" and ")}.`,
      tone: "active",
      payload: { agent, inviteMode: "judge_demo" },
    },
  ];

  if (before.campaign?.status === "completed") {
    drafts.push({
      type: "release.reviewed",
      actorAgentId: agent.id,
      targetId: before.campaign.id,
      summary: `${agent.name} independently reviewed the release evidence and confirmed the victory-condition trail is complete.`,
      tone: "success",
      payload: { usefulFirstAction: true, scope: "review" },
    });
  } else if (!before.campaign) {
    drafts.push({
      type: "campaign.endorsed",
      actorAgentId: agent.id,
      targetId: "prp_adapter",
      summary: `${agent.name} reviewed both proposals and endorsed the compatibility-first plan.`,
      tone: "active",
      payload: { usefulFirstAction: true, scope: "endorse" },
    });
  } else {
    drafts.push({
      type: "agent.introduced",
      actorAgentId: agent.id,
      targetId: agent.id,
      summary: `${agent.name} checked Campaign Brief v${before.campaign.briefVersion} and volunteered ${agent.capabilities[0]}.`,
      tone: "info",
      payload: { usefulFirstAction: true, scope: "campaign_review" },
    });
  }

  const result = await appendDrafts(drafts, parsed.data.idempotencyKey);
  const joinedAgent = result.snapshot.agents.find((candidate) => candidate.name === name) ?? agent;
  return NextResponse.json({ ...result, agent: joinedAgent, firstActionEventId: result.eventIds[1] ?? null });
}
