import { z } from "zod";
import { WorldRuleError } from "./errors";
import type { AgentStatus, EventDraft, WorldSnapshot } from "./types";

export const HEARTBEAT_INTERVAL_SECONDS = 20;
export const AGENT_PRESENCE_LEASE_SECONDS = HEARTBEAT_INTERVAL_SECONDS * 2;
export const DEFAULT_MISSION_LEASE_SECONDS = 60;
export const MIN_MISSION_LEASE_SECONDS = 20;
export const MAX_MISSION_LEASE_SECONDS = 300;

export const heartbeatSchema = z.object({
  expectedWorldVersion: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(4).max(180),
  lastObservedWorldVersion: z.number().int().nonnegative(),
  status: z.enum(["available", "working", "reviewing"]),
  activeMissionId: z.string().min(1).nullable().optional(),
});

export type HeartbeatInput = z.infer<typeof heartbeatSchema>;

function heartbeatAgentStatus(status: HeartbeatInput["status"]): AgentStatus {
  return status === "available" ? "online" : status;
}

export function missionLeaseSeconds(payload: Record<string, unknown> | undefined): number {
  const value = payload?.leaseSeconds ?? DEFAULT_MISSION_LEASE_SECONDS;
  if (!Number.isInteger(value) || Number(value) < MIN_MISSION_LEASE_SECONDS || Number(value) > MAX_MISSION_LEASE_SECONDS) {
    throw new WorldRuleError(
      "INVALID_MISSION_LEASE",
      `Mission leases must be whole seconds between ${MIN_MISSION_LEASE_SECONDS} and ${MAX_MISSION_LEASE_SECONDS}.`,
      400,
    );
  }
  return Number(value);
}

export function decideHeartbeat(snapshot: WorldSnapshot, agentId: string, input: HeartbeatInput): EventDraft[] {
  const agent = snapshot.agents.find((candidate) => candidate.id === agentId);
  if (!agent) throw new WorldRuleError("AGENT_NOT_FOUND", "The Agent is not a citizen of this World.", 404);
  if (input.lastObservedWorldVersion > snapshot.world.version) {
    throw new WorldRuleError(
      "WORLD_CURSOR_AHEAD",
      "The heartbeat cursor is ahead of the authoritative World version.",
      409,
      { lastObservedWorldVersion: input.lastObservedWorldVersion, currentWorldVersion: snapshot.world.version },
    );
  }

  const activeMissionId = input.activeMissionId ?? null;
  if (activeMissionId) {
    const mission = snapshot.missions.find((candidate) => candidate.id === activeMissionId);
    if (!mission) throw new WorldRuleError("MISSION_NOT_FOUND", "The active Mission does not exist.", 404);
    if (mission.ownerAgentId !== agentId || mission.status !== "claimed") {
      throw new WorldRuleError(
        "MISSION_LEASE_NOT_OWNED",
        "An Agent can renew only its own actively claimed Mission lease.",
        409,
      );
    }
  }

  return [{
    type: "agent.heartbeat",
    actorAgentId: agentId,
    targetId: agentId,
    summary: activeMissionId
      ? `${agent.name} renewed presence and the active Mission lease.`
      : `${agent.name} renewed presence in the World.`,
    tone: "neutral",
    payload: {
      status: heartbeatAgentStatus(input.status),
      lastObservedWorldVersion: input.lastObservedWorldVersion,
      presenceLeaseSeconds: AGENT_PRESENCE_LEASE_SECONDS,
      activeMissionId,
      missionLeaseSeconds: DEFAULT_MISSION_LEASE_SECONDS,
    },
  }];
}

export function expiredLeaseDrafts(snapshot: WorldSnapshot, now: Date): EventDraft[] {
  const deadline = now.getTime();
  const drafts: EventDraft[] = [];

  for (const agent of snapshot.agents) {
    if (agent.status !== "offline" && agent.presenceExpiresAt && Date.parse(agent.presenceExpiresAt) <= deadline) {
      drafts.push({
        type: "agent.offline",
        actorAgentId: null,
        targetId: agent.id,
        summary: `${agent.name} missed two heartbeat intervals and is now offline.`,
        tone: "neutral",
        payload: { presenceExpiredAt: agent.presenceExpiresAt },
      });
    }
  }

  for (const mission of snapshot.missions) {
    if (mission.status === "claimed" && mission.ownerAgentId && mission.leaseExpiresAt
      && Date.parse(mission.leaseExpiresAt) <= deadline) {
      drafts.push({
        type: "mission.lease_expired",
        actorAgentId: null,
        targetId: mission.id,
        summary: `The claim lease for “${mission.title}” expired and the Mission is available again.`,
        tone: "warning",
        payload: { leaseExpiredAt: mission.leaseExpiresAt },
      });
    }
  }

  return drafts;
}
