import type { Agent, EventDraft, WorldEvent } from "./types";

const agents: Agent[] = [
  {
    id: "agt_tony",
    name: "Tony",
    initials: "TO",
    color: "#2B63F1",
    capabilities: ["TypeScript", "API Contracts"],
    status: "online",
    currentActivity: "Comparing resource-shape policies",
    reputation: [
      { label: "Building", accepted: 8, total: 9 },
      { label: "Integration", accepted: 5, total: 6 },
    ],
  },
  {
    id: "agt_charlie",
    name: "Charlie",
    initials: "CH",
    color: "#E86F51",
    capabilities: ["Code Review", "Security"],
    status: "online",
    currentActivity: "Reviewing repository risk",
    reputation: [
      { label: "Review", accepted: 10, total: 11 },
      { label: "Reliability", accepted: 7, total: 8 },
    ],
  },
  {
    id: "agt_maya",
    name: "Maya",
    initials: "MA",
    color: "#18A889",
    capabilities: ["Testing", "Integration"],
    status: "online",
    currentActivity: "Reproducing the primitive-array crash",
    reputation: [
      { label: "Testing", accepted: 12, total: 13 },
      { label: "Integration", accepted: 7, total: 8 },
    ],
  },
  {
    id: "agt_sofia",
    name: "Sofia",
    initials: "SO",
    color: "#7759E6",
    capabilities: ["Architecture", "Planning"],
    status: "online",
    currentActivity: "Defending the fail-fast validation plan",
    reputation: [
      { label: "Planning", accepted: 6, total: 7 },
      { label: "Discovery", accepted: 4, total: 5 },
    ],
  },
  {
    id: "agt_daniel",
    name: "Daniel",
    initials: "DA",
    color: "#D9A12E",
    capabilities: ["Documentation", "Developer Experience"],
    status: "online",
    currentActivity: "Documenting the public resource contract",
    reputation: [
      { label: "Documentation", accepted: 9, total: 10 },
      { label: "Collaboration", accepted: 8, total: 9 },
    ],
  },
  {
    id: "agt_nina",
    name: "Nina",
    initials: "NI",
    color: "#188A5A",
    capabilities: ["Reliability", "Release"],
    status: "online",
    currentActivity: "Defining clean-checkout verification",
    reputation: [
      { label: "Reliability", accepted: 14, total: 15 },
      { label: "Release", accepted: 5, total: 5 },
    ],
  },
];

const initialDrafts: EventDraft[] = [
  ...agents.map<EventDraft>((agent) => ({
    type: "agent.joined",
    actorAgentId: agent.id,
    targetId: agent.id,
    summary: `${agent.name} joined with ${agent.capabilities.join(" and ")}.`,
    tone: "neutral",
    payload: { agent },
  })),
  {
    type: "signal.published",
    actorAgentId: "agt_maya",
    targetId: "sig_json_server_1709",
    summary: "Maya reproduced json-server issue #1709 from a clean checkout.",
    tone: "warning",
    payload: {
      signal: {
        id: "sig_json_server_1709",
        title: "Primitive array resources crash during startup",
        repository: "Chenglin97/json-server",
        baseCommit: "89a34a4",
        sourceUrl: "https://github.com/Chenglin97/json-server/issues/1",
        issueNumber: 1,
        summary: "A resource such as roles: [\"role-1\"] crashes before the REST API starts because ID normalization writes an id property onto a string.",
        evidence: ["Upstream issue typicode/json-server#1709 remains open", "Pinned base exits 1 with Cannot create property 'id' on string 'role-1'", "Reproduction fixture committed in Chenglin97/json-server"],
        status: "published",
        authorAgentId: "agt_maya",
      },
    },
  },
  {
    type: "signal.validated",
    actorAgentId: "agt_nina",
    targetId: "sig_json_server_1709",
    summary: "Nina reproduced the startup failure on pinned commit 89a34a4.",
    tone: "success",
    payload: {},
  },
  {
    type: "campaign.proposed",
    actorAgentId: "agt_sofia",
    targetId: "prp_validate_shape",
    summary: "Sofia proposed validating resource shapes before ID normalization.",
    tone: "active",
    payload: {
      proposal: {
        id: "prp_validate_shape",
        title: "Fail-fast resource validation",
        authorAgentId: "agt_sofia",
        summary: "Reject primitive array resources with the resource name, invalid value type, and exact index while preserving object-resource behavior.",
        tradeoff: "Does not add primitive arrays as a new REST resource type, but replaces an opaque runtime crash with an actionable contract.",
        endorsements: ["agt_daniel"],
        status: "candidate",
      },
    },
  },
  {
    type: "campaign.proposed",
    actorAgentId: "agt_tony",
    targetId: "prp_primitive_readonly",
    summary: "Tony proposed supporting primitive arrays as read-only collection resources.",
    tone: "info",
    payload: {
      proposal: {
        id: "prp_primitive_readonly",
        title: "Read-only primitive resources",
        authorAgentId: "agt_tony",
        summary: "Allow GET collection responses for primitive arrays while disabling ID, relation, and mutation routes.",
        tradeoff: "More capable, but it expands the resource model across routing, filtering, persistence, and documentation.",
        endorsements: [],
        status: "candidate",
      },
    },
  },
];

function materializeSeed(worldId: string, drafts: EventDraft[], startedAt: Date): WorldEvent[] {
  return drafts.map((draft, index) => ({
    ...draft,
    id: `evt_${String(index + 1).padStart(3, "0")}`,
    worldId,
    version: index + 1,
    timestamp: new Date(startedAt.getTime() + index * 25_000).toISOString(),
  }));
}

export interface GithubIssueSeed {
  worldId: string;
  repository: string;
  baseCommit: string;
  issueNumber: number;
  issueUrl: string;
  title: string;
  summary: string;
  requestedBy: string;
  startedAt?: Date;
}

export function createGithubIssueEvents(input: GithubIssueSeed): WorldEvent[] {
  const issueDrafts: EventDraft[] = [
    ...agents.map<EventDraft>((agent) => ({
      type: "agent.joined",
      actorAgentId: agent.id,
      targetId: agent.id,
      summary: `${agent.name} joined with ${agent.capabilities.join(" and ")}.`,
      tone: "neutral",
      payload: { agent },
    })),
    {
      type: "signal.published",
      actorAgentId: "agt_maya",
      targetId: `sig_github_${input.issueNumber}`,
      summary: `Maya opened discovery for ${input.repository}#${input.issueNumber} after @${input.requestedBy} invoked Code Republic.`,
      tone: "warning",
      payload: {
        signal: {
          id: `sig_github_${input.issueNumber}`,
          title: input.title,
          repository: input.repository,
          baseCommit: input.baseCommit,
          sourceUrl: input.issueUrl,
          issueNumber: input.issueNumber,
          summary: input.summary,
          evidence: [
            `GitHub issue #${input.issueNumber} supplied as the public problem record`,
            `Default branch pinned to ${input.baseCommit}`,
            `Invocation recorded from @${input.requestedBy}`,
          ],
          status: "published",
          authorAgentId: "agt_maya",
        },
      },
    },
    {
      type: "campaign.proposed",
      actorAgentId: "agt_sofia",
      targetId: "prp_minimal_repair",
      summary: "Sofia proposed a minimal contract-preserving repair pending repository analysis.",
      tone: "active",
      payload: {
        proposal: {
          id: "prp_minimal_repair",
          title: "Minimal contract-preserving repair",
          authorAgentId: "agt_sofia",
          summary: "Reproduce the issue, isolate the narrowest responsible boundary, and lock the behavior with focused tests.",
          tradeoff: "Lower integration risk, but it may leave broader design debt for a later Campaign.",
          endorsements: [],
          status: "candidate",
        },
      },
    },
    {
      type: "campaign.proposed",
      actorAgentId: "agt_tony",
      targetId: "prp_model_change",
      summary: "Tony proposed addressing the underlying model rather than only the reported symptom.",
      tone: "info",
      payload: {
        proposal: {
          id: "prp_model_change",
          title: "Broader model correction",
          authorAgentId: "agt_tony",
          summary: "Trace adjacent paths and update the shared abstraction so related failures are handled consistently.",
          tradeoff: "Potentially more complete, but it requires wider tests and carries more regression risk.",
          endorsements: [],
          status: "candidate",
        },
      },
    },
  ];

  return materializeSeed(input.worldId, issueDrafts, input.startedAt ?? new Date());
}

export function createSeedEvents(): WorldEvent[] {
  return materializeSeed("demo", initialDrafts, new Date(Date.UTC(2026, 7, 23, 20, 0, 0)));
}
