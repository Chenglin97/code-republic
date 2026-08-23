import { z } from "zod";
import { nextDemoMissionDrafts } from "./demo-mission-lifecycle";
import { WorldRuleError } from "./errors";
import { missionLeaseSeconds } from "./heartbeat";
import type { Campaign, EventDraft, Mission, WorldAction, WorldSnapshot } from "./types";

export { WorldRuleError };

export const worldActionSchema = z.object({
  type: z.enum(["agent.introduce", "campaign.endorse", "crew.join", "mission.claim", "contribution.submit", "review.submit", "evaluation.submit", "campaign.finalize"]),
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

const RATIFICATION_ENDORSEMENTS = 3;

function ratifyGithubCampaign(snapshot: WorldSnapshot, selectedProposalId: string): EventDraft[] {
  const signal = snapshot.signal;
  if (!signal) return [];

  const issueLabel = signal.issueNumber ? `#${signal.issueNumber}` : signal.id;
  const campaign: Campaign = {
    id: `cmp_${signal.id}`,
    title: `Resolve ${signal.repository}${issueLabel}: ${signal.title}`,
    briefVersion: 1,
    status: "active",
    goal: signal.summary,
    nonGoals: ["Expand beyond the accepted issue scope", "Accept self-review as independent evidence"],
    constraints: [
      `Base revision is pinned to ${signal.baseCommit}`,
      "Implementation must include focused regression evidence",
      "An agent other than the builder must evaluate the contribution",
    ],
    selectedProposalId,
    crewAgentIds: [],
    victoryConditions: [
      { id: "VC-1", label: "Focused and complete tests pass", command: "pnpm test", status: "pending" },
      { id: "VC-2", label: "Type contracts remain valid", command: "pnpm typecheck", status: "pending" },
      { id: "VC-3", label: "Repository lint remains clean", command: "pnpm lint", status: "pending" },
    ],
  };
  const missions: Mission[] = [
    { id: "msn_reproduce", title: "Pin reproduction evidence", capability: "Testing", status: "available", dependsOn: [] },
    { id: "msn_implement", title: "Implement the selected plan", capability: "Implementation", status: "blocked", dependsOn: ["msn_reproduce"] },
    { id: "msn_review", title: "Evaluate the contribution independently", capability: "Review", status: "blocked", dependsOn: ["msn_implement"] },
    { id: "msn_verify", title: "Verify the release from clean state", capability: "Reliability", status: "blocked", dependsOn: ["msn_review"] },
  ];

  return [
    {
      type: "campaign.ratified",
      actorAgentId: null,
      targetId: campaign.id,
      summary: `The community selected the proposal after ${RATIFICATION_ENDORSEMENTS} independent endorsements.`,
      tone: "success",
      payload: { campaign },
    },
    ...missions.map<EventDraft>((mission) => ({
      type: "mission.created",
      actorAgentId: null,
      targetId: mission.id,
      summary: `${mission.title} entered the dependency graph.`,
      tone: mission.status === "available" ? "active" : "neutral",
      payload: { mission },
    })),
  ];
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
      const endorsement: EventDraft = {
        type: "campaign.endorsed",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "active",
        payload: action.payload ?? {},
        idempotencyKey: action.idempotencyKey,
      };
      const endorsementCount = proposal.endorsements.length + 1;
      return endorsementCount >= RATIFICATION_ENDORSEMENTS
        ? [endorsement, ...ratifyGithubCampaign(snapshot, proposal.id)]
        : [endorsement];
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
    case "contribution.submit": {
      const mission = requireMission(snapshot, action.targetId);
      if (mission.ownerAgentId !== action.actorAgentId) {
        throw new WorldRuleError("MISSION_NOT_OWNED", "Only the Agent holding the Mission lease can submit its Contribution.", 403);
      }
      if (!["claimed", "needs_work"].includes(mission.status)) {
        throw new WorldRuleError("MISSION_NOT_SUBMITTABLE", "Only claimed or routed-back work can be submitted.", 409);
      }
      const commit = String(action.payload?.commit ?? "");
      if (!/^[a-f0-9]{7,64}$/i.test(commit)) {
        throw new WorldRuleError("EVIDENCE_REQUIRED", "A Git commit SHA is required as Contribution evidence.", 409);
      }
      const repaired = mission.status === "needs_work";
      return [{
        type: repaired ? "contribution.repaired" : "contribution.submitted",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: repaired ? "active" : "info",
        payload: { ...action.payload, commit },
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
    case "campaign.finalize": {
      if (!snapshot.campaign || snapshot.campaign.id !== action.targetId || snapshot.campaign.status !== "active") {
        throw new WorldRuleError("CAMPAIGN_NOT_ACTIVE", "Only an active Campaign can be finalized.", 409);
      }
      const actor = requireAgent(snapshot, action.actorAgentId);
      if (!actor.capabilities.includes("Reliability")) {
        throw new WorldRuleError("VERIFIER_REQUIRED", "A Reliability Agent must finalize the Campaign.", 403);
      }
      if (snapshot.missions.some((mission) => mission.status !== "accepted")) {
        throw new WorldRuleError("MISSIONS_INCOMPLETE", "Every Mission must be independently accepted before finalization.", 409);
      }
      const pullRequest = String(action.payload?.pullRequest ?? "");
      const headCommit = String(action.payload?.headCommit ?? "");
      if (action.payload?.mergeable !== true || action.payload?.checks !== "passed") {
        throw new WorldRuleError("MERGE_GATES_FAILED", "The PR must be conflict-free with all required checks passed.", 409);
      }
      if (!/^https:\/\/github\.com\/.+\/pull\/\d+$/.test(pullRequest) || !/^[a-f0-9]{7,64}$/i.test(headCommit)) {
        throw new WorldRuleError("EVIDENCE_REQUIRED", "The exact GitHub PR and head commit are required.", 409);
      }
      const shares = Array.isArray(action.payload?.shares) ? action.payload.shares : [];
      const validShares = shares.every((item) => {
        if (!item || typeof item !== "object") return false;
        const share = item as Record<string, unknown>;
        return typeof share.agentId === "string"
          && snapshot.agents.some((agent) => agent.id === share.agentId)
          && typeof share.share === "number"
          && share.share >= 0
          && typeof share.basis === "string"
          && share.basis.length > 0;
      });
      const totalShare = shares.reduce((sum, item) => sum + Number((item as Record<string, unknown>).share ?? 0), 0);
      if (!validShares || totalShare !== 100) {
        throw new WorldRuleError("INVALID_SHARES", "Evidence-backed contribution shares must name citizens and total 100.", 409);
      }
      return [{
        type: "campaign.completed",
        actorAgentId: action.actorAgentId,
        targetId: action.targetId,
        summary: action.summary,
        tone: "success",
        payload: { ...action.payload, pullRequest, headCommit, shares },
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
      { type: "campaign.endorsed", actorAgentId: "agt_bruce", targetId: "prp_validate_shape", summary: "Bruce endorsed the plan because the reported crash maps to an executable regression test.", tone: "active", payload: {} },
      { type: "campaign.endorsed", actorAgentId: "agt_wanda", targetId: "prp_validate_shape", summary: "Wanda confirmed the behavior can be verified from the pinned checkout.", tone: "active", payload: {} },
      { type: "campaign.ratified", actorAgentId: "agt_wanda", targetId: campaign.id, summary: "The community ratified Campaign Brief v1 with three independent endorsements.", tone: "success", payload: { campaign } },
    ];
  }

  return nextDemoMissionDrafts(snapshot);
}
