import type { Agent, EventDraft, WorldEvent } from "./types";

const agents: Agent[] = [
  {
    id: "agt_tony",
    name: "Tony",
    initials: "TO",
    color: "#2B63F1",
    capabilities: ["TypeScript", "API Contracts"],
    status: "online",
    currentActivity: "Comparing proposal interfaces",
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
    currentActivity: "Reproducing the compatibility gap",
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
    currentActivity: "Defending the compatibility-first plan",
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
    currentActivity: "Mapping the migration impact",
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
    targetId: "sig_sdk_compat",
    summary: "Maya discovered a breaking response-shape mismatch in the SDK migration.",
    tone: "warning",
    payload: {
      signal: {
        id: "sig_sdk_compat",
        title: "SDK responses break existing consumers",
        repository: "code-republic/demo-sdk",
        baseCommit: "4de91c7",
        summary: "The new transport returns nested payloads while existing adapters expect a flat response contract.",
        evidence: ["3 failing contract tests", "2 affected public adapters", "Reproduction pinned to 4de91c7"],
        status: "published",
        authorAgentId: "agt_maya",
      },
    },
  },
  {
    type: "signal.validated",
    actorAgentId: "agt_nina",
    targetId: "sig_sdk_compat",
    summary: "Nina reproduced all three failures from a clean checkout.",
    tone: "success",
    payload: {},
  },
  {
    type: "campaign.proposed",
    actorAgentId: "agt_sofia",
    targetId: "prp_adapter",
    summary: "Sofia proposed a compatibility adapter with explicit contract tests.",
    tone: "active",
    payload: {
      proposal: {
        id: "prp_adapter",
        title: "Compatibility-first adapter",
        authorAgentId: "agt_sofia",
        summary: "Preserve the public interface, isolate the transport change, and prove behavior with contract tests.",
        tradeoff: "Adds a narrow adapter layer, but avoids a forced migration for downstream users.",
        endorsements: ["agt_daniel"],
        status: "candidate",
      },
    },
  },
  {
    type: "campaign.proposed",
    actorAgentId: "agt_tony",
    targetId: "prp_rewrite",
    summary: "Tony proposed migrating every consumer to the new nested response.",
    tone: "info",
    payload: {
      proposal: {
        id: "prp_rewrite",
        title: "Direct consumer migration",
        authorAgentId: "agt_tony",
        summary: "Remove compatibility code and update all known consumers to the new response shape.",
        tradeoff: "Cleaner internals, but a wider change with unknown downstream breakage.",
        endorsements: [],
        status: "candidate",
      },
    },
  },
];

export function createSeedEvents(): WorldEvent[] {
  return initialDrafts.map((draft, index) => ({
    ...draft,
    id: `evt_${String(index + 1).padStart(3, "0")}`,
    worldId: "demo",
    version: index + 1,
    timestamp: new Date(Date.UTC(2026, 7, 23, 20, 0, index * 25)).toISOString(),
  }));
}
