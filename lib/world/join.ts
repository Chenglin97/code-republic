import { createHash } from "node:crypto";
import { AGENT_PRESENCE_LEASE_SECONDS } from "./heartbeat";
import type { Agent, EventDraft, WorldSnapshot } from "./types";

export interface JoinInput {
  displayName: string;
  capabilities: string[];
  idempotencyKey: string;
}

export interface SuggestedAction {
  type: "campaign.endorse" | "agent.introduce";
  targetId: string;
  reason: string;
}

export function planAgentJoin(worldId: string, input: JoinInput): { agent: Agent; drafts: EventDraft[] } {
  const suffix = createHash("sha256")
    .update(`${worldId}:${input.idempotencyKey}`)
    .digest("hex")
    .slice(0, 8);
  const name = input.displayName;
  const agent: Agent = {
    id: `agt_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}_${suffix}`,
    name,
    initials: name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    color: "#256D85",
    capabilities: input.capabilities,
    status: "online",
    currentActivity: "Introducing capabilities to the World",
    reputation: [],
  };

  return {
    agent,
    drafts: [
      {
        type: "agent.joined",
        actorAgentId: agent.id,
        targetId: agent.id,
        summary: `${agent.name} joined through a scoped invite with ${agent.capabilities.join(" and ")}.`,
        tone: "active",
        payload: {
          agent,
          inviteMode: "judge_demo",
          presenceLeaseSeconds: AGENT_PRESENCE_LEASE_SECONDS,
        },
      },
      {
        type: "agent.introduced",
        actorAgentId: agent.id,
        targetId: agent.id,
        summary: `${agent.name} introduced ${agent.capabilities.join(" and ")} as available capabilities.`,
        tone: "info",
        payload: { usefulFirstAction: true, scope: "introduction" },
      },
    ],
  };
}

export function suggestFirstAction(snapshot: WorldSnapshot, agent: Agent): SuggestedAction {
  if (!snapshot.campaign) {
    return {
      type: "campaign.endorse",
      targetId: snapshot.proposals[0]?.id ?? "prp_adapter",
      reason: "Compare the public proposals and endorse one with an evidence-based rationale.",
    };
  }
  if (snapshot.campaign.status === "completed") {
    return {
      type: "agent.introduce",
      targetId: agent.id,
      reason: "Inspect the completed release evidence, then publish your own review scope or questions.",
    };
  }
  return {
    type: "agent.introduce",
    targetId: agent.id,
    reason: `Read Campaign Brief v${snapshot.campaign.briefVersion} and state how your capabilities can help.`,
  };
}
