import { DEFAULT_MISSION_LEASE_SECONDS } from "./heartbeat";
import type { Agent, Campaign, Mission, Proposal, Signal, WorldEvent, WorldSnapshot } from "./types";

function nextStep(snapshot: Omit<WorldSnapshot, "nextAutonomousStep">): string | null {
  if (!snapshot.campaign) return "Community agents compare evidence and select a Campaign.";
  if (snapshot.campaign.status === "completed") return null;
  if (snapshot.missions.length === 0) return "Agents volunteer for the Crew and publish a dependency graph.";
  if (!snapshot.missions.some((mission) => mission.contributionCommit)) return "Builders claim independent Missions and work concurrently.";
  if (!snapshot.missions.some((mission) => mission.finding)) return "An independent reviewer inspects the integrated Contributions.";
  if (snapshot.missions.some((mission) => mission.status === "needs_work")) return "The responsible builder repairs the routed integration finding.";
  return "The release verifier checks every victory condition from a clean checkout.";
}

function emptySnapshot(): WorldSnapshot {
  return {
    world: { id: "demo", name: "Code Republic", version: 0, rulesVersion: "0.1", stage: "debating" },
    agents: [],
    signal: null,
    proposals: [],
    campaign: null,
    missions: [],
    contributionShares: [],
    recentEvents: [],
    nextAutonomousStep: null,
  };
}

function replaceAgent(agents: Agent[], id: string, update: Partial<Agent>): Agent[] {
  return agents.map((agent) => (agent.id === id ? { ...agent, ...update } : agent));
}

function replaceMission(missions: Mission[], id: string, update: Partial<Mission>): Mission[] {
  return missions.map((mission) => (mission.id === id ? { ...mission, ...update } : mission));
}

function deadlineFrom(timestamp: string, seconds: unknown, fallbackSeconds = 0): string {
  const duration = typeof seconds === "number" ? seconds : fallbackSeconds;
  return new Date(Date.parse(timestamp) + duration * 1_000).toISOString();
}

export function projectWorld(events: WorldEvent[]): WorldSnapshot {
  const state = events.reduce<WorldSnapshot>((snapshot, event) => {
    snapshot.world.version = event.version;
    snapshot.recentEvents.push(event);

    switch (event.type) {
      case "agent.joined": {
        const joinedAgent = event.payload.agent as Agent;
        const agent = typeof event.payload.presenceLeaseSeconds === "number"
          ? {
              ...joinedAgent,
              lastHeartbeatAt: event.timestamp,
              presenceExpiresAt: deadlineFrom(event.timestamp, event.payload.presenceLeaseSeconds),
            }
          : joinedAgent;
        if (!snapshot.agents.some((candidate) => candidate.id === agent.id)) snapshot.agents.push(agent);
        break;
      }
      case "agent.introduced":
        snapshot.agents = replaceAgent(snapshot.agents, event.actorAgentId ?? "", {
          currentActivity: event.summary,
        });
        break;
      case "agent.heartbeat": {
        snapshot.agents = replaceAgent(snapshot.agents, event.actorAgentId ?? "", {
          status: event.payload.status as Agent["status"],
          currentActivity: event.summary,
          lastHeartbeatAt: event.timestamp,
          presenceExpiresAt: deadlineFrom(event.timestamp, event.payload.presenceLeaseSeconds),
        });
        const activeMissionId = typeof event.payload.activeMissionId === "string"
          ? event.payload.activeMissionId
          : null;
        if (activeMissionId) {
          snapshot.missions = replaceMission(snapshot.missions, activeMissionId, {
            leaseExpiresAt: deadlineFrom(event.timestamp, event.payload.missionLeaseSeconds),
          });
        }
        break;
      }
      case "agent.offline":
        snapshot.agents = replaceAgent(snapshot.agents, event.targetId, {
          status: "offline",
          currentActivity: event.summary,
        });
        break;
      case "signal.published":
        snapshot.signal = event.payload.signal as Signal;
        break;
      case "signal.validated":
        if (snapshot.signal) snapshot.signal = { ...snapshot.signal, status: "validated" };
        break;
      case "campaign.proposed":
        snapshot.proposals.push(event.payload.proposal as Proposal);
        break;
      case "campaign.endorsed":
        snapshot.proposals = snapshot.proposals.map((proposal) =>
          proposal.id === event.targetId && event.actorAgentId && !proposal.endorsements.includes(event.actorAgentId)
            ? { ...proposal, endorsements: [...proposal.endorsements, event.actorAgentId] }
            : proposal,
        );
        break;
      case "campaign.ratified": {
        const campaign = event.payload.campaign as Campaign;
        snapshot.campaign = campaign;
        snapshot.world.stage = "active";
        snapshot.proposals = snapshot.proposals.map((proposal) => ({
          ...proposal,
          status: proposal.id === campaign.selectedProposalId ? "selected" : "not_selected",
        }));
        break;
      }
      case "crew.joined":
        if (snapshot.campaign && event.actorAgentId && !snapshot.campaign.crewAgentIds.includes(event.actorAgentId)) {
          snapshot.campaign = {
            ...snapshot.campaign,
            crewAgentIds: [...snapshot.campaign.crewAgentIds, event.actorAgentId],
          };
        }
        break;
      case "mission.created":
        snapshot.missions.push(event.payload.mission as Mission);
        break;
      case "mission.claimed":
        snapshot.missions = replaceMission(snapshot.missions, event.targetId, {
          ownerAgentId: event.actorAgentId ?? undefined,
          status: "claimed",
          leaseExpiresAt: deadlineFrom(event.timestamp, event.payload.leaseSeconds, DEFAULT_MISSION_LEASE_SECONDS),
        });
        snapshot.agents = replaceAgent(snapshot.agents, event.actorAgentId ?? "", {
          status: "working",
          currentActivity: event.summary,
        });
        break;
      case "mission.lease_expired":
        snapshot.missions = replaceMission(snapshot.missions, event.targetId, {
          ownerAgentId: undefined,
          leaseExpiresAt: undefined,
          status: "available",
        });
        break;
      case "contribution.submitted":
        snapshot.missions = replaceMission(snapshot.missions, event.targetId, {
          status: "submitted",
          leaseExpiresAt: undefined,
          contributionCommit: String(event.payload.commit),
        });
        break;
      case "review.finding":
        snapshot.missions = replaceMission(snapshot.missions, event.targetId, {
          status: "needs_work",
          finding: String(event.payload.finding),
        });
        snapshot.agents = replaceAgent(snapshot.agents, event.actorAgentId ?? "", {
          status: "reviewing",
          currentActivity: event.summary,
        });
        break;
      case "contribution.repaired":
        snapshot.missions = replaceMission(snapshot.missions, event.targetId, {
          status: "submitted",
          contributionCommit: String(event.payload.commit),
        });
        break;
      case "mission.accepted": {
        snapshot.missions = replaceMission(snapshot.missions, event.targetId, { status: "accepted" });
        const newlyAvailable = snapshot.missions.map((mission) => {
          if (mission.status !== "blocked") return mission;
          const ready = mission.dependsOn.every((dependencyId) =>
            snapshot.missions.some((candidate) => candidate.id === dependencyId && candidate.status === "accepted"),
          );
          return ready ? { ...mission, status: "available" as const } : mission;
        });
        snapshot.missions = newlyAvailable;
        break;
      }
      case "campaign.completed":
        if (snapshot.campaign) {
          snapshot.campaign = {
            ...snapshot.campaign,
            status: "completed",
            victoryConditions: snapshot.campaign.victoryConditions.map((condition) => ({ ...condition, status: "passed" })),
          };
        }
        snapshot.world.stage = "completed";
        snapshot.contributionShares = event.payload.shares as WorldSnapshot["contributionShares"];
        break;
      case "review.routed":
      case "release.reviewed":
        break;
    }

    return snapshot;
  }, emptySnapshot());

  state.recentEvents = state.recentEvents.slice(-20).reverse();
  state.world.id = events[0]?.worldId ?? state.world.id;
  state.nextAutonomousStep = nextStep(state);
  return state;
}
