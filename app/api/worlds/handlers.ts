import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AGENT_PRESENCE_LEASE_SECONDS,
  DEFAULT_MISSION_LEASE_SECONDS,
  HEARTBEAT_INTERVAL_SECONDS,
} from "../../../lib/world/heartbeat";
import { planAgentJoin, suggestFirstAction } from "../../../lib/world/join";
import type { AppendOptions } from "../../../lib/world/authority";
import type { ActionResult, EventDraft, WorldSnapshot } from "../../../lib/world/types";
import {
  getWorldAgentIds,
  getWorldId,
  readJson,
  worldErrorResponse,
  type WorldAgentRouteContext,
  type WorldRouteContext,
} from "./route-utils";

export interface WorldHttpDependencies {
  appendDrafts(worldId: string, drafts: EventDraft[], options?: AppendOptions): Promise<ActionResult>;
  submitAction(worldId: string, input: unknown): Promise<ActionResult>;
  heartbeatAgent(worldId: string, agentId: string, input: unknown): Promise<ActionResult>;
  getSnapshot(worldId: string): Promise<WorldSnapshot>;
}

const joinSchema = z.object({
  inviteCode: z.string().min(4).max(80),
  displayName: z.string().trim().min(2).max(32),
  capabilities: z.array(z.string().trim().min(2).max(40)).min(1).max(4),
  idempotencyKey: z.string().min(4).max(180),
});

export async function postWorldJoin(
  request: Request,
  context: WorldRouteContext,
  dependencies: Pick<WorldHttpDependencies, "appendDrafts">,
  configuredInvite = process.env.CODE_REPUBLIC_DEMO_INVITE_CODE,
) {
  try {
    const parsed = joinSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_JOIN", message: parsed.error.issues[0]?.message ?? "Invalid join request." } },
        { status: 400 },
      );
    }
    if (configuredInvite && parsed.data.inviteCode !== configuredInvite) {
      return NextResponse.json(
        { error: { code: "INVALID_INVITE", message: "The invite code is invalid." } },
        { status: 403 },
      );
    }

    const worldId = await getWorldId(context);
    const { agent, drafts } = planAgentJoin(worldId, parsed.data);
    const result = await dependencies.appendDrafts(worldId, drafts, {
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
      heartbeatUrl: `/api/worlds/${worldId}/agents/${agent.id}/heartbeat`,
      heartbeatIntervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
      presenceLeaseSeconds: AGENT_PRESENCE_LEASE_SECONDS,
      missionLeaseSeconds: DEFAULT_MISSION_LEASE_SECONDS,
    });
  } catch (error) {
    return worldErrorResponse(error, "The Agent could not join this World.");
  }
}

export async function postWorldAction(
  request: Request,
  context: WorldRouteContext,
  dependencies: Pick<WorldHttpDependencies, "submitAction">,
) {
  try {
    return NextResponse.json(await dependencies.submitAction(await getWorldId(context), await readJson(request)));
  } catch (error) {
    return worldErrorResponse(error, "The World could not record this action.");
  }
}

export async function postAgentHeartbeat(
  request: Request,
  context: WorldAgentRouteContext,
  dependencies: Pick<WorldHttpDependencies, "heartbeatAgent">,
) {
  try {
    const { worldId, agentId } = await getWorldAgentIds(context);
    return NextResponse.json(await dependencies.heartbeatAgent(worldId, agentId, await readJson(request)));
  } catch (error) {
    return worldErrorResponse(error, "The Agent heartbeat could not be recorded.");
  }
}

export async function getWorldSnapshot(
  _request: Request,
  context: WorldRouteContext,
  dependencies: Pick<WorldHttpDependencies, "getSnapshot">,
) {
  try {
    return NextResponse.json(await dependencies.getSnapshot(await getWorldId(context)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return worldErrorResponse(error, "The World snapshot could not be loaded.");
  }
}
