import { describe, expect, it } from "vitest";
import { nextDemoMissionDrafts } from "./demo-mission-lifecycle";
import { createDemoMissions } from "./demo-missions";
import { projectWorld } from "./reducer";
import { createSeedEvents } from "./seed";
import type { Campaign, EventDraft, WorldEvent } from "./types";

function append(events: WorldEvent[], drafts: EventDraft[]): WorldEvent[] {
  const baseVersion = events.at(-1)?.version ?? 0;
  return [
    ...events,
    ...drafts.map((draft, index) => ({
      ...draft,
      id: `deep_${baseVersion + index + 1}`,
      worldId: "demo",
      version: baseVersion + index + 1,
      timestamp: new Date(Date.UTC(2026, 7, 23, 22, 0, baseVersion + index)).toISOString(),
    })),
  ];
}

function campaign(): Campaign {
  return {
    id: "cmp_json_server_1709",
    title: "Replace json-server's primitive-array crash with a clear contract",
    briefVersion: 1,
    status: "active",
    goal: "Reject invalid resource shapes with actionable evidence.",
    nonGoals: [],
    constraints: [],
    selectedProposalId: "prp_validate_shape",
    crewAgentIds: [],
    victoryConditions: [],
  };
}

describe("demo Mission dependency graph", () => {
  it("publishes eight executable Missions across five dependency levels", () => {
    const missions = createDemoMissions();
    const byId = new Map(missions.map((mission) => [mission.id, mission]));
    const depth = (missionId: string): number => {
      const mission = byId.get(missionId);
      if (!mission) throw new Error(`Unknown Mission ${missionId}`);
      return mission.dependsOn.length === 0
        ? 1
        : 1 + Math.max(...mission.dependsOn.map(depth));
    };

    expect(missions).toHaveLength(8);
    expect(new Set(missions.map((mission) => mission.id))).toHaveProperty("size", 8);
    expect(missions.filter((mission) => mission.status === "available")).toHaveLength(3);
    expect(missions.every((mission) => mission.dependsOn.every((dependencyId) => byId.has(dependencyId)))).toBe(true);
    expect(depth("msn_release")).toBe(5);
  });

  it("moves every Mission through real dependency-gated demo transitions", () => {
    let events = append(createSeedEvents(), [{
      type: "campaign.ratified",
      actorAgentId: "agt_nina",
      targetId: "cmp_json_server_1709",
      summary: "The community ratified the Campaign.",
      tone: "success",
      payload: { campaign: campaign() },
    }]);

    events = append(events, nextDemoMissionDrafts(projectWorld(events)));
    let snapshot = projectWorld(events);
    expect(snapshot.missions).toHaveLength(8);
    expect(snapshot.missions.filter((mission) => mission.status === "available")).toHaveLength(3);
    expect(snapshot.missions.filter((mission) => mission.status === "blocked")).toHaveLength(5);

    events = append(events, nextDemoMissionDrafts(snapshot));
    snapshot = projectWorld(events);
    expect(snapshot.missions.filter((mission) => mission.status === "submitted")).toHaveLength(3);
    expect(snapshot.missions.find((mission) => mission.id === "msn_validation")?.status).toBe("blocked");

    events = append(events, nextDemoMissionDrafts(snapshot));
    snapshot = projectWorld(events);
    expect(snapshot.missions.find((mission) => mission.id === "msn_validation")).toMatchObject({
      status: "submitted",
      ownerAgentId: "agt_tony",
    });

    events = append(events, nextDemoMissionDrafts(snapshot));
    snapshot = projectWorld(events);
    expect(snapshot.missions.find((mission) => mission.id === "msn_validation")?.status).toBe("needs_work");

    events = append(events, nextDemoMissionDrafts(snapshot));
    snapshot = projectWorld(events);
    expect(snapshot.missions.find((mission) => mission.id === "msn_validation")?.status).toBe("submitted");

    events = append(events, nextDemoMissionDrafts(snapshot));
    snapshot = projectWorld(events);
    expect(snapshot.missions.every((mission) => mission.status === "accepted")).toBe(true);
    expect(snapshot.world.stage).toBe("completed");
    expect(snapshot.contributionShares.reduce((sum, item) => sum + item.share, 0)).toBe(100);
  });
});
