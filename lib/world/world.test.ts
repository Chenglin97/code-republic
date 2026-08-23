import { describe, expect, it } from "vitest";
import { decideAction, nextDemoDrafts, WorldRuleError } from "./actions";
import { projectWorld } from "./reducer";
import { createSeedEvents } from "./seed";
import type { EventDraft, WorldAction, WorldEvent, WorldSnapshot } from "./types";

function append(snapshotEvents: WorldEvent[], drafts: EventDraft[]): WorldEvent[] {
  const base = snapshotEvents.at(-1)?.version ?? 0;
  return [
    ...snapshotEvents,
    ...drafts.map((draft, index) => ({
      ...draft,
      id: `test_${base + index + 1}`,
      worldId: "demo",
      version: base + index + 1,
      timestamp: new Date(base + index + 1).toISOString(),
    })),
  ];
}

function runDemoToEnd(): { events: WorldEvent[]; snapshot: WorldSnapshot } {
  let events = createSeedEvents();
  for (let index = 0; index < 10; index += 1) {
    const drafts = nextDemoDrafts(projectWorld(events));
    if (drafts.length === 0) break;
    events = append(events, drafts);
  }
  return { events, snapshot: projectWorld(events) };
}

describe("World projection", () => {
  it("begins with a validated Signal and two competing proposals", () => {
    const snapshot = projectWorld(createSeedEvents());
    expect(snapshot.signal?.status).toBe("validated");
    expect(snapshot.proposals).toHaveLength(2);
    expect(snapshot.campaign).toBeNull();
    expect(snapshot.world.stage).toBe("debating");
  });

  it("completes the autonomous loop with evidence-backed shares", () => {
    const { snapshot } = runDemoToEnd();
    expect(snapshot.world.stage).toBe("completed");
    expect(snapshot.missions.every((mission) => mission.status === "accepted")).toBe(true);
    expect(snapshot.campaign?.victoryConditions.every((condition) => condition.status === "passed")).toBe(true);
    expect(snapshot.contributionShares.reduce((sum, item) => sum + item.share, 0)).toBe(100);
  });
});

describe("World rules", () => {
  it("blocks a Mission while dependencies are unmet", () => {
    let events = createSeedEvents();
    events = append(events, nextDemoDrafts(projectWorld(events)));
    events = append(events, nextDemoDrafts(projectWorld(events)));
    const snapshot = projectWorld(events);
    const action: WorldAction = {
      type: "mission.claim",
      actorAgentId: "agt_nina",
      targetId: "msn_integration",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "test:blocked:claim",
      summary: "Nina wants to claim integration.",
    };
    expect(() => decideAction(snapshot, action)).toThrowError(WorldRuleError);
    expect(() => decideAction(snapshot, action)).toThrowError(/dependencies/);
  });

  it("forbids a builder from reviewing their own Contribution", () => {
    let events = createSeedEvents();
    for (let index = 0; index < 3; index += 1) events = append(events, nextDemoDrafts(projectWorld(events)));
    const snapshot = projectWorld(events);
    const action: WorldAction = {
      type: "review.submit",
      actorAgentId: "agt_tony",
      targetId: "msn_contract",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "test:self-review",
      summary: "Tony approves his adapter.",
      payload: { finding: "No issues" },
    };
    expect(() => decideAction(snapshot, action)).toThrowError(/cannot review their own/);
  });
});
