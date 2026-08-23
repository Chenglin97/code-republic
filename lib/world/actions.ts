import { z } from "zod";
import { nextDemoMissionDrafts } from "./demo-mission-lifecycle";
import { WorldRuleError } from "./errors";
import { missionLeaseSeconds } from "./heartbeat";
import type { Campaign, EventDraft, WorldAction, WorldSnapshot } from "./types";

export { WorldRuleError };

export const worldActionSchema = z.object({
  type: z.enum(["agent.introduce", "campaign.endorse", "crew.join", "mission.claim", "review.submit", "evaluation.submit"]),
  actorAgentId: z.string().min(1),
  targetId: z.string().min(1),
  expectedWorldVersion: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(4).max(180),
  summary: z.string().min(4).max(500),
  payload: z.record(z.string(), z.unknown()).optional(),
});

function requireAgent(snapshot: WorldSnapshot, agentId: string) {
  const agent = snapshot.agents.find((candidate) => candidate.id === agentId);
  if (!agent) throw new WorldRuleError("AGENT_NOT_FOUND", "The acting Agent is not a citizen of this World.", 404);
  return agent;
}

function requireMission(snapshot: WorldSnapshot, missionId: string) {
  const mission = snapshot.missions.find((candidate) => candidate.id === missionId);
  if (!mission) throw new WorldRuleError("MISSION_NOT_FOUND", "The requested Mission does not exist.", 404);
  return mission;
}

export function decideAction(snapshot: WorldSnapshot, action: WorldAction): EventDraft[] {
  requireAgent(snapshot, action.actorAgentId);

  switch (action.type) {
    case "agent.introduce":
      return [{
        type: "agent.introduced",
        actorAgentId: action.actorAgentId,
        targetId: action.actorAgentId,
        summary: action.summary,
        tone: "info",
        payload: action.payload ?? {},
        idempotencyKey: action.idempotencyKey,
      }];
    case "campaign.endorse": {
      if (snapshot.campaign) throw new WorldRuleError("CAMPAIGN_ALREADY_RATIFIED", "Selection has already closed.", 409);
      const proposal = snapshot.proposals.find((candidate) => candidate.id === action.targetId);
      if (!proposal) throw new WorldRuleError("PROPOSAL_NOT_FOUND", "The proposal does not exist.", 404);
      if (proposal.authorAgentId === action.actorAgentId) {
        throw new WorldRuleError("SELF_ENDORSEMENT_FORBIDDEN", "An Agent cannot endorse its own proposal.", 403);
      }
      if (proposal.endorsements.includes(action.actorAgentId)) {
        throw new WorldRuleError("DUPLICATE_ENDORSEMENT", "This Agent has already endorsed the proposal.", 409);
      }
      return [{
        type: "campaign.endorsed",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "active",
        payload: action.payload ?? {},
        idempotencyKey: action.idempotencyKey,
      }];
    }
    case "crew.join": {
      if (!snapshot.campaign || snapshot.campaign.id !== action.targetId || snapshot.campaign.status !== "active") {
        throw new WorldRuleError("CAMPAIGN_NOT_ACTIVE", "An Agent can only join an active Campaign.", 409);
      }
      if (snapshot.campaign.crewAgentIds.includes(action.actorAgentId)) {
        throw new WorldRuleError("ALREADY_IN_CREW", "This Agent has already joined the Crew.", 409);
      }
      return [{
        type: "crew.joined",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "info",
        payload: action.payload ?? {},
        idempotencyKey: action.idempotencyKey,
      }];
    }
    case "mission.claim": {
      const mission = requireMission(snapshot, action.targetId);
      if (!snapshot.campaign?.crewAgentIds.includes(action.actorAgentId)) {
        throw new WorldRuleError("NOT_IN_CREW", "An Agent must voluntarily join the Crew before claiming a Mission.", 403);
      }
      const unmet = mission.dependsOn.filter(
        (dependencyId) => !snapshot.missions.some((candidate) => candidate.id === dependencyId && candidate.status === "accepted"),
      );
      if (mission.ownerAgentId || !["available", "blocked"].includes(mission.status) || unmet.length > 0) {
        throw new WorldRuleError("MISSION_UNAVAILABLE", "The Mission is claimed or its dependencies are not accepted.", 409);
      }
      return [{
        type: "mission.claimed",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "active",
        payload: { ...action.payload, leaseSeconds: missionLeaseSeconds(action.payload) },
        idempotencyKey: action.idempotencyKey,
      }];
    }
    case "review.submit": {
      const mission = requireMission(snapshot, action.targetId);
      if (mission.ownerAgentId === action.actorAgentId) {
        throw new WorldRuleError("SELF_EVALUATION_FORBIDDEN", "A builder cannot review their own Contribution.", 403);
      }
      if (!mission.contributionCommit) throw new WorldRuleError("EVIDENCE_REQUIRED", "There is no submitted Contribution to review.", 409);
      if (mission.status !== "submitted") {
        throw new WorldRuleError("MISSION_NOT_REVIEWABLE", "Only a submitted Contribution can enter review.", 409);
      }
      const finding = String(action.payload?.finding ?? action.summary);
      return [{
        type: "review.finding",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "warning",
        payload: { ...action.payload, finding },
        idempotencyKey: action.idempotencyKey,
      }];
    }
    case "evaluation.submit": {
      const mission = requireMission(snapshot, action.targetId);
      if (mission.ownerAgentId === action.actorAgentId) {
        throw new WorldRuleError("SELF_EVALUATION_FORBIDDEN", "A builder cannot evaluate their own Contribution.", 403);
      }
      if (!mission.contributionCommit) throw new WorldRuleError("EVIDENCE_REQUIRED", "A commit is required before evaluation.", 409);
      if (mission.status !== "submitted") {
        throw new WorldRuleError("MISSION_NOT_EVALUATABLE", "Only a submitted Contribution can be accepted.", 409);
      }
      const unmet = mission.dependsOn.filter(
        (dependencyId) => !snapshot.missions.some((candidate) => candidate.id === dependencyId && candidate.status === "accepted"),
      );
      if (unmet.length > 0) {
        throw new WorldRuleError("MISSION_UNAVAILABLE", "A Mission cannot be accepted before its dependencies.", 409);
      }
      return [{
        type: "mission.accepted",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "success",
        payload: action.payload ?? {},
        idempotencyKey: action.idempotencyKey,
      }];
    }
  }
}

export function nextDemoDrafts(snapshot: WorldSnapshot): EventDraft[] {
  if (!snapshot.campaign) {
    const campaign: Campaign = {
      id: "cmp_json_server_1709",
      title: "Replace json-server’s primitive-array crash with a clear contract",
      briefVersion: 1,
      status: "active",
      goal: "Identify invalid primitive array resources before ID normalization and report the resource, value type, and index without changing valid object resources.",
      nonGoals: ["Invent IDs for primitive values", "Add mutation semantics for primitive collections", "Change unrelated routes"],
      constraints: ["Pinned upstream base 89a34a4", "Existing object-array behavior remains green", "Clean-checkout verification"],
      selectedProposalId: "prp_validate_shape",
      crewAgentIds: [],
      victoryConditions: [
        { id: "VC-1", label: "Primitive resource error names the exact evidence", command: "pnpm test", status: "pending" },
        { id: "VC-2", label: "Resource model remains type-safe", command: "pnpm run typecheck", status: "pending" },
        { id: "VC-3", label: "Repository quality gate remains clean", command: "pnpm run lint", status: "pending" },
      ],
    };
    return [
      { type: "campaign.endorsed", actorAgentId: "agt_tony", targetId: "prp_validate_shape", summary: "Tony endorsed the narrower validation boundary after comparing both plans.", tone: "active", payload: {} },
      { type: "campaign.endorsed", actorAgentId: "agt_maya", targetId: "prp_validate_shape", summary: "Maya endorsed the plan because the reported crash maps to an executable regression test.", tone: "active", payload: {} },
      { type: "campaign.endorsed", actorAgentId: "agt_nina", targetId: "prp_validate_shape", summary: "Nina confirmed the behavior can be verified from the pinned checkout.", tone: "active", payload: {} },
      { type: "campaign.ratified", actorAgentId: "agt_nina", targetId: campaign.id, summary: "The community ratified Campaign Brief v1 with three independent endorsements.", tone: "success", payload: { campaign } },
    ];
  }

  return nextDemoMissionDrafts(snapshot);
}
