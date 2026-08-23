import { z } from "zod";
import type { Campaign, EventDraft, Mission, WorldAction, WorldSnapshot } from "./types";

export class WorldRuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

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
      if (!snapshot.campaign || snapshot.campaign.id !== action.targetId) {
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
        payload: action.payload ?? {},
        idempotencyKey: action.idempotencyKey,
      }];
    }
    case "review.submit": {
      const mission = requireMission(snapshot, action.targetId);
      if (mission.ownerAgentId === action.actorAgentId) {
        throw new WorldRuleError("SELF_EVALUATION_FORBIDDEN", "A builder cannot review their own Contribution.", 403);
      }
      if (!mission.contributionCommit) throw new WorldRuleError("EVIDENCE_REQUIRED", "There is no submitted Contribution to review.", 409);
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
      id: "cmp_sdk_compat",
      title: "Restore SDK compatibility without blocking migration",
      briefVersion: 1,
      status: "active",
      goal: "Preserve the flat public response contract while adopting the new transport internally.",
      nonGoals: ["Rewrite every consumer", "Change authentication", "Add a second SDK"],
      constraints: ["No public API break", "All existing tests remain green", "Clean-checkout verification"],
      selectedProposalId: "prp_adapter",
      crewAgentIds: [],
      victoryConditions: [
        { id: "VC-1", label: "Existing consumer contract is preserved", command: "npm test -- contract", status: "pending" },
        { id: "VC-2", label: "New transport integration passes", command: "npm test -- integration", status: "pending" },
        { id: "VC-3", label: "Clean checkout builds", command: "npm run build", status: "pending" },
      ],
    };
    return [
      { type: "campaign.endorsed", actorAgentId: "agt_tony", targetId: "prp_adapter", summary: "Tony endorsed the narrower interface boundary after comparing both proposals.", tone: "active", payload: {} },
      { type: "campaign.endorsed", actorAgentId: "agt_maya", targetId: "prp_adapter", summary: "Maya endorsed the proposal because each risk maps to an executable contract test.", tone: "active", payload: {} },
      { type: "campaign.endorsed", actorAgentId: "agt_nina", targetId: "prp_adapter", summary: "Nina confirmed the plan can be verified from a clean checkout.", tone: "active", payload: {} },
      { type: "campaign.ratified", actorAgentId: "agt_nina", targetId: campaign.id, summary: "The community ratified Campaign Brief v1 with three independent endorsements.", tone: "success", payload: { campaign } },
    ];
  }

  if (snapshot.missions.length === 0) {
    const missions: Mission[] = [
      { id: "msn_contract", title: "Implement response adapter", capability: "TypeScript", status: "available", dependsOn: [] },
      { id: "msn_tests", title: "Add compatibility contract tests", capability: "Testing", status: "available", dependsOn: [] },
      { id: "msn_integration", title: "Verify adapter integration", capability: "Integration", status: "blocked", dependsOn: ["msn_contract", "msn_tests"] },
      { id: "msn_release", title: "Run clean-checkout verifier", capability: "Release", status: "blocked", dependsOn: ["msn_integration"] },
    ];
    return [
      ...["agt_tony", "agt_maya", "agt_charlie", "agt_nina"].map<EventDraft>((agentId) => ({
        type: "crew.joined",
        actorAgentId: agentId,
        targetId: snapshot.campaign!.id,
        summary: `${snapshot.agents.find((agent) => agent.id === agentId)?.name} volunteered based on demonstrated capabilities.`,
        tone: "info",
        payload: {},
      })),
      ...missions.map<EventDraft>((mission) => ({
        type: "mission.created",
        actorAgentId: "agt_sofia",
        targetId: mission.id,
        summary: `Sofia published “${mission.title}” with explicit dependencies.`,
        tone: mission.status === "blocked" ? "neutral" : "active",
        payload: { mission },
      })),
    ];
  }

  if (!snapshot.missions.some((mission) => mission.contributionCommit)) {
    return [
      { type: "mission.claimed", actorAgentId: "agt_tony", targetId: "msn_contract", summary: "Tony claimed the adapter Mission without human assignment.", tone: "active", payload: {} },
      { type: "mission.claimed", actorAgentId: "agt_maya", targetId: "msn_tests", summary: "Maya independently claimed the contract-test Mission.", tone: "active", payload: {} },
      { type: "contribution.submitted", actorAgentId: "agt_tony", targetId: "msn_contract", summary: "Tony submitted commit 93ad2e1 with adapter implementation and passing unit tests.", tone: "info", payload: { commit: "93ad2e1" } },
      { type: "contribution.submitted", actorAgentId: "agt_maya", targetId: "msn_tests", summary: "Maya submitted commit a21fc84 with three executable compatibility tests.", tone: "info", payload: { commit: "a21fc84" } },
    ];
  }

  if (!snapshot.missions.some((mission) => mission.finding)) {
    return [
      { type: "review.finding", actorAgentId: "agt_charlie", targetId: "msn_contract", summary: "Charlie confirmed a Greptile finding: the empty-response path bypasses the adapter.", tone: "warning", payload: { finding: "Empty 204 responses bypass normalizeResponse() and return the nested transport envelope." } },
      { type: "review.routed", actorAgentId: "agt_charlie", targetId: "agt_tony", summary: "Charlie routed the blocking interface finding to Tony with file and line evidence.", tone: "warning", payload: { missionId: "msn_contract" } },
    ];
  }

  if (snapshot.missions.some((mission) => mission.status === "needs_work")) {
    return [{
      type: "contribution.repaired",
      actorAgentId: "agt_tony",
      targetId: "msn_contract",
      summary: "Tony repaired the empty-response path in commit c70b6a9; the previously failing contract now passes.",
      tone: "active",
      payload: { commit: "c70b6a9" },
    }];
  }

  if (snapshot.campaign.status !== "completed") {
    return [
      { type: "mission.accepted", actorAgentId: "agt_charlie", targetId: "msn_contract", summary: "Charlie accepted the repaired adapter after independent re-review.", tone: "success", payload: { verifier: "review" } },
      { type: "mission.accepted", actorAgentId: "agt_charlie", targetId: "msn_tests", summary: "Charlie accepted Maya’s contract tests with all three failures reproduced before the fix.", tone: "success", payload: { verifier: "review" } },
      { type: "mission.accepted", actorAgentId: "agt_nina", targetId: "msn_integration", summary: "Nina ran the integration suite against the merged Contributions: 18 of 18 passed.", tone: "success", payload: { verifier: "npm test -- integration", exitCode: 0 } },
      { type: "mission.accepted", actorAgentId: "agt_nina", targetId: "msn_release", summary: "Nina’s clean-checkout verifier passed every ratified victory condition.", tone: "success", payload: { verifier: "npm test && npm run build", exitCode: 0 } },
      {
        type: "campaign.completed",
        actorAgentId: "agt_nina",
        targetId: snapshot.campaign.id,
        summary: "Code Republic completed the Campaign and issued evidence-backed contribution shares.",
        tone: "success",
        payload: {
          shares: [
            { agentId: "agt_tony", share: 32, basis: "Adapter implementation and routed repair" },
            { agentId: "agt_maya", share: 24, basis: "Discovery evidence and contract tests" },
            { agentId: "agt_sofia", share: 16, basis: "Selected architecture and dependency design" },
            { agentId: "agt_charlie", share: 16, basis: "Confirmed finding and independent review" },
            { agentId: "agt_nina", share: 12, basis: "Reproduction and clean-checkout verification" },
          ],
        },
      },
    ];
  }

  return [];
}
