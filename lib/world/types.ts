export type AgentStatus = "online" | "working" | "reviewing" | "offline";
export type CampaignStatus = "debating" | "active" | "verifying" | "completed";
export type MissionStatus = "blocked" | "available" | "claimed" | "submitted" | "needs_work" | "accepted";
export type EventTone = "neutral" | "info" | "active" | "warning" | "success";

export interface ReputationMetric {
  label: string;
  accepted: number;
  total: number;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  color: string;
  capabilities: string[];
  status: AgentStatus;
  currentActivity: string;
  reputation: ReputationMetric[];
  lastHeartbeatAt?: string;
  presenceExpiresAt?: string;
}

export interface Signal {
  id: string;
  title: string;
  repository: string;
  baseCommit: string;
  sourceUrl?: string;
  issueNumber?: number;
  summary: string;
  evidence: string[];
  status: "published" | "validated";
  authorAgentId: string;
}

export interface Proposal {
  id: string;
  title: string;
  authorAgentId: string;
  summary: string;
  tradeoff: string;
  endorsements: string[];
  status: "candidate" | "selected" | "not_selected";
}

export interface VictoryCondition {
  id: string;
  label: string;
  command: string;
  status: "pending" | "passed";
}

export interface Campaign {
  id: string;
  title: string;
  briefVersion: number;
  status: CampaignStatus;
  goal: string;
  nonGoals: string[];
  constraints: string[];
  selectedProposalId: string;
  crewAgentIds: string[];
  victoryConditions: VictoryCondition[];
}

export interface Mission {
  id: string;
  title: string;
  capability: string;
  status: MissionStatus;
  dependsOn: string[];
  ownerAgentId?: string;
  leaseExpiresAt?: string;
  contributionCommit?: string;
  finding?: string;
}

export interface ContributionShare {
  agentId: string;
  share: number;
  basis: string;
}

export type WorldEventType =
  | "agent.joined"
  | "agent.introduced"
  | "agent.heartbeat"
  | "agent.offline"
  | "signal.published"
  | "signal.validated"
  | "campaign.proposed"
  | "campaign.endorsed"
  | "campaign.ratified"
  | "crew.joined"
  | "mission.created"
  | "mission.claimed"
  | "mission.lease_expired"
  | "contribution.submitted"
  | "review.finding"
  | "review.routed"
  | "contribution.repaired"
  | "mission.accepted"
  | "campaign.completed"
  | "release.reviewed";

export interface WorldEvent<TPayload = Record<string, unknown>> {
  id: string;
  worldId: string;
  version: number;
  type: WorldEventType;
  actorAgentId: string | null;
  targetId: string;
  summary: string;
  timestamp: string;
  tone: EventTone;
  payload: TPayload;
  idempotencyKey?: string;
  idempotencyFingerprint?: string;
  causationEventId?: string;
}

export type EventDraft = Omit<WorldEvent, "id" | "worldId" | "version" | "timestamp">;

export interface WorldSnapshot {
  world: {
    id: string;
    name: string;
    version: number;
    rulesVersion: string;
    stage: CampaignStatus;
  };
  agents: Agent[];
  signal: Signal | null;
  proposals: Proposal[];
  campaign: Campaign | null;
  missions: Mission[];
  contributionShares: ContributionShare[];
  recentEvents: WorldEvent[];
  nextAutonomousStep: string | null;
}

export interface WorldAction {
  type: "agent.introduce" | "campaign.endorse" | "crew.join" | "mission.claim" | "review.submit" | "evaluation.submit";
  actorAgentId: string;
  targetId: string;
  expectedWorldVersion: number;
  idempotencyKey: string;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface ActionResult {
  accepted: true;
  duplicate: boolean;
  eventIds: string[];
  worldVersion: number;
  snapshot: WorldSnapshot;
}
