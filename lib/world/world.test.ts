import { describe, expect, it } from "vitest";
import { decideAction, nextDemoDrafts, WorldRuleError } from "./actions";
import { WorldAuthority } from "./authority";
import { planAgentJoin } from "./join";
import { StorageVersionConflict, validateEventLog, type WorldEventStorage } from "./persistence";
import { projectWorld } from "./reducer";
import { createSeedEvents } from "./seed";
import type { EventDraft, WorldAction, WorldEvent, WorldSnapshot } from "./types";

class MemoryStorage implements WorldEventStorage {
  private events: WorldEvent[] | null = null;

  async read(): Promise<WorldEvent[] | null> {
    return this.events ? structuredClone(this.events) : null;
  }

  async append(_worldId: string, expectedVersion: number, events: WorldEvent[]): Promise<void> {
    const current = this.events ?? [];
    const currentVersion = current.at(-1)?.version ?? 0;
    if (currentVersion !== expectedVersion) throw new StorageVersionConflict(expectedVersion, currentVersion);
    this.events = structuredClone([...current, ...events]);
  }

  async replace(_worldId: string, events: WorldEvent[]): Promise<void> {
    this.events = structuredClone(events);
  }
}

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
    expect(snapshot.contributionShares.find((item) => item.agentId === "agt_daniel")?.share).toBeGreaterThan(0);
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

  it("requires an Agent to join the Crew before claiming a Mission", () => {
    let events = createSeedEvents();
    events = append(events, nextDemoDrafts(projectWorld(events)));
    events = append(events, nextDemoDrafts(projectWorld(events)));
    const snapshot = projectWorld(events);
    expect(() => decideAction(snapshot, {
      type: "mission.claim",
      actorAgentId: "agt_sofia",
      targetId: "msn_contract",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "test:not-in-crew",
      summary: "Sofia attempts to claim the adapter Mission.",
    })).toThrowError(/join the Crew/);
  });

  it("bounds requested Mission leases", () => {
    let events = createSeedEvents();
    events = append(events, nextDemoDrafts(projectWorld(events)));
    events = append(events, nextDemoDrafts(projectWorld(events)));
    const snapshot = projectWorld(events);
    expect(() => decideAction(snapshot, {
      type: "mission.claim",
      actorAgentId: "agt_tony",
      targetId: "msn_contract",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "test:oversized-lease",
      summary: "Tony requests an unbounded claim.",
      payload: { leaseSeconds: 3_600 },
    })).toThrowError(/between 20 and 300/);
  });
});

describe("World authority", () => {
  it("returns the original result for an idempotent retry", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    const snapshot = await authority.getSnapshot("demo");
    const action: WorldAction = {
      type: "agent.introduce",
      actorAgentId: "agt_tony",
      targetId: "agt_tony",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "test:introduce:tony",
      summary: "Tony offers TypeScript contract implementation.",
    };
    const first = await authority.submitAction("demo", action);
    const retry = await authority.submitAction("demo", action);
    expect(first.duplicate).toBe(false);
    expect(retry.duplicate).toBe(true);
    expect(retry.eventIds).toEqual(first.eventIds);
    expect(retry.worldVersion).toBe(first.worldVersion);
  });

  it("rejects reuse of one idempotency key for a different request", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    const snapshot = await authority.getSnapshot("demo");
    const action: WorldAction = {
      type: "agent.introduce",
      actorAgentId: "agt_tony",
      targetId: "agt_tony",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "test:reused:key",
      summary: "Tony offers TypeScript contract implementation.",
    };
    await authority.submitAction("demo", action);
    await expect(authority.submitAction("demo", { ...action, summary: "Tony changes the request body." }))
      .rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED", status: 409 });
  });

  it("atomically gives one of two racing claimants the Mission", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    let snapshot = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(snapshot), { expectedWorldVersion: snapshot.world.version });
    snapshot = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(snapshot), { expectedWorldVersion: snapshot.world.version });
    snapshot = await authority.getSnapshot("demo");
    const makeClaim = (actorAgentId: string, key: string): WorldAction => ({
      type: "mission.claim",
      actorAgentId,
      targetId: "msn_contract",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: key,
      summary: `${actorAgentId} claims the available contract Mission.`,
    });

    const results = await Promise.allSettled([
      authority.submitAction("demo", makeClaim("agt_tony", "race:tony")),
      authority.submitAction("demo", makeClaim("agt_maya", "race:maya")),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    expect(rejected?.reason).toMatchObject({ code: "WORLD_VERSION_CONFLICT", status: 409 });
    const after = await authority.getSnapshot("demo");
    expect(after.missions.find((mission) => mission.id === "msn_contract")?.ownerAgentId)
      .toMatch(/^agt_(tony|maya)$/);
  });

  it("resets the event log to the deterministic seed", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    const before = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(before));
    const reset = await authority.resetWorld("demo");
    expect(reset.world.version).toBe(createSeedEvents().length);
    expect(reset.campaign).toBeNull();
    expect(reset.proposals).toHaveLength(2);
  });

  it("rejects unsupported Worlds and malformed event sequences", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    await expect(authority.getSnapshot("other")).rejects.toMatchObject({ code: "WORLD_NOT_FOUND", status: 404 });
    const corrupt = createSeedEvents();
    corrupt[1] = { ...corrupt[1]!, version: 8 };
    expect(() => validateEventLog("demo", corrupt)).toThrow(/expected 2/);
  });

  it("renews presence and one owned Mission lease, then expires each deadline explicitly", async () => {
    let now = new Date("2026-08-23T21:00:00.000Z");
    const authority = new WorldAuthority(new MemoryStorage(), undefined, () => now);
    let snapshot = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(snapshot), { expectedWorldVersion: snapshot.world.version });
    snapshot = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(snapshot), { expectedWorldVersion: snapshot.world.version });
    snapshot = await authority.getSnapshot("demo");

    const claim = await authority.submitAction("demo", {
      type: "mission.claim",
      actorAgentId: "agt_tony",
      targetId: "msn_contract",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "lease:tony:contract",
      summary: "Tony claims the contract Mission with a bounded lease.",
      payload: { leaseSeconds: 20 },
    });
    expect(claim.snapshot.missions.find((mission) => mission.id === "msn_contract")?.leaseExpiresAt)
      .toBe("2026-08-23T21:00:20.000Z");

    now = new Date("2026-08-23T21:00:10.000Z");
    const heartbeat = await authority.heartbeatAgent("demo", "agt_tony", {
      expectedWorldVersion: claim.worldVersion,
      idempotencyKey: "heartbeat:tony:1",
      lastObservedWorldVersion: claim.worldVersion,
      status: "working",
      activeMissionId: "msn_contract",
    });
    expect(heartbeat.snapshot.agents.find((agent) => agent.id === "agt_tony")?.presenceExpiresAt)
      .toBe("2026-08-23T21:00:50.000Z");
    expect(heartbeat.snapshot.missions.find((mission) => mission.id === "msn_contract")?.leaseExpiresAt)
      .toBe("2026-08-23T21:01:10.000Z");

    now = new Date("2026-08-23T21:00:51.000Z");
    snapshot = await authority.getSnapshot("demo");
    expect(snapshot.agents.find((agent) => agent.id === "agt_tony")?.status).toBe("offline");
    expect(snapshot.missions.find((mission) => mission.id === "msn_contract")?.status).toBe("claimed");

    now = new Date("2026-08-23T21:01:11.000Z");
    snapshot = await authority.getSnapshot("demo");
    const mission = snapshot.missions.find((candidate) => candidate.id === "msn_contract");
    expect(mission).toMatchObject({ status: "available" });
    expect(mission?.ownerAgentId).toBeUndefined();
    expect(mission?.leaseExpiresAt).toBeUndefined();
    expect(snapshot.recentEvents.slice(0, 2).map((event) => event.type))
      .toEqual(["mission.lease_expired", "agent.offline"]);
  });

  it("does not let one Agent renew another Agent's Mission lease", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    let snapshot = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(snapshot), { expectedWorldVersion: snapshot.world.version });
    snapshot = await authority.getSnapshot("demo");
    await authority.appendDrafts("demo", nextDemoDrafts(snapshot), { expectedWorldVersion: snapshot.world.version });
    snapshot = await authority.getSnapshot("demo");
    const claim = await authority.submitAction("demo", {
      type: "mission.claim",
      actorAgentId: "agt_tony",
      targetId: "msn_contract",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "lease:owner:tony",
      summary: "Tony claims the contract Mission.",
    });

    await expect(authority.heartbeatAgent("demo", "agt_maya", {
      expectedWorldVersion: claim.worldVersion,
      idempotencyKey: "heartbeat:maya:wrong-mission",
      lastObservedWorldVersion: claim.worldVersion,
      status: "working",
      activeMissionId: "msn_contract",
    })).rejects.toMatchObject({ code: "MISSION_LEASE_NOT_OWNED", status: 409 });
  });
});

describe("Agent join", () => {
  it("creates a stable identity on retries without fabricating a review", () => {
    const input = {
      displayName: "Judge Nova",
      capabilities: ["Code Review"],
      idempotencyKey: "judge:nova:join",
    };
    const first = planAgentJoin("demo", input);
    const retry = planAgentJoin("demo", input);
    expect(retry.agent.id).toBe(first.agent.id);
    expect(first.drafts.map((draft) => draft.type)).toEqual(["agent.joined", "agent.introduced"]);
    expect(first.drafts.some((draft) => draft.type === "release.reviewed")).toBe(false);
    expect(first.drafts[0]?.payload.presenceLeaseSeconds).toBe(40);
  });
});
