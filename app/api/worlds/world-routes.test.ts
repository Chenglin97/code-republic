import { describe, expect, it } from "vitest";
import { WorldAuthority } from "../../../lib/world/authority";
import { StorageVersionConflict, type WorldEventStorage } from "../../../lib/world/persistence";
import type { WorldEvent } from "../../../lib/world/types";
import {
  getWorldSnapshot,
  postAgentHeartbeat,
  postWorldAction,
  postWorldJoin,
  type WorldHttpDependencies,
} from "./handlers";

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

function dependencies(authority: WorldAuthority): WorldHttpDependencies {
  return {
    appendDrafts: authority.appendDrafts.bind(authority),
    submitAction: authority.submitAction.bind(authority),
    heartbeatAgent: authority.heartbeatAgent.bind(authority),
    getSnapshot: authority.getSnapshot.bind(authority),
  };
}

function worldContext(worldId = "demo") {
  return { params: Promise.resolve({ worldId }) };
}

function agentContext(agentId: string, worldId = "demo") {
  return { params: Promise.resolve({ worldId, agentId }) };
}

function jsonRequest(path: string, body: unknown) {
  return new Request(`https://republic.example${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("World HTTP contract", () => {
  it("joins idempotently and advertises the concrete heartbeat lease contract", async () => {
    const authority = new WorldAuthority(
      new MemoryStorage(),
      undefined,
      () => new Date("2026-08-23T21:00:00.000Z"),
    );
    const api = dependencies(authority);
    const body = {
      inviteCode: "judge-demo",
      displayName: "Judge Nova",
      capabilities: ["Code Review", "Testing"],
      idempotencyKey: "join:judge:nova",
    };
    const response = await postWorldJoin(
      jsonRequest("/api/worlds/demo/join", body),
      worldContext(),
      api,
      "judge-demo",
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      accepted: true,
      duplicate: false,
      heartbeatIntervalSeconds: 20,
      presenceLeaseSeconds: 40,
      missionLeaseSeconds: 60,
      snapshotUrl: "/api/worlds/demo/snapshot",
    });
    expect(payload.heartbeatUrl).toBe(`/api/worlds/demo/agents/${payload.agent.id}/heartbeat`);
    expect(payload.agent.presenceExpiresAt).toBe("2026-08-23T21:00:40.000Z");

    const retry = await postWorldJoin(
      jsonRequest("/api/worlds/demo/join", body),
      worldContext(),
      api,
      "judge-demo",
    );
    expect(await retry.json()).toMatchObject({ duplicate: true, agent: { id: payload.agent.id } });

    const denied = await postWorldJoin(
      jsonRequest("/api/worlds/demo/join", { ...body, inviteCode: "wrong", idempotencyKey: "join:denied" }),
      worldContext(),
      api,
      "judge-demo",
    );
    expect(denied.status).toBe(403);
    expect(await denied.json()).toMatchObject({ error: { code: "INVALID_INVITE" } });
  });

  it("returns structured JSON, idempotency, and optimistic-conflict responses for actions", async () => {
    const authority = new WorldAuthority(new MemoryStorage());
    const api = dependencies(authority);
    const snapshot = await authority.getSnapshot("demo");
    const action = {
      type: "agent.introduce",
      actorAgentId: "agt_tony",
      targetId: "agt_tony",
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey: "http:introduce:tony",
      summary: "Tony offers TypeScript API contract support.",
    };
    const first = await postWorldAction(
      jsonRequest("/api/worlds/demo/actions", action),
      worldContext(),
      api,
    );
    const firstPayload = await first.json();
    expect(first.status).toBe(200);
    expect(firstPayload).toMatchObject({ accepted: true, duplicate: false });
    expect(firstPayload.eventIds).toHaveLength(1);

    const retry = await postWorldAction(
      jsonRequest("/api/worlds/demo/actions", action),
      worldContext(),
      api,
    );
    expect(await retry.json()).toMatchObject({ duplicate: true, eventIds: firstPayload.eventIds });

    const stale = await postWorldAction(
      jsonRequest("/api/worlds/demo/actions", { ...action, idempotencyKey: "http:introduce:stale" }),
      worldContext(),
      api,
    );
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      error: { code: "WORLD_VERSION_CONFLICT", currentWorldVersion: firstPayload.worldVersion },
    });

    const malformed = await postWorldAction(
      new Request("https://republic.example/api/worlds/demo/actions", { method: "POST", body: "{" }),
      worldContext(),
      api,
    );
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ error: { code: "INVALID_JSON" } });
  });

  it("records idempotent heartbeats and serves uncached authoritative snapshots", async () => {
    const authority = new WorldAuthority(
      new MemoryStorage(),
      undefined,
      () => new Date("2026-08-23T21:00:00.000Z"),
    );
    const api = dependencies(authority);
    const join = await postWorldJoin(
      jsonRequest("/api/worlds/demo/join", {
        inviteCode: "judge-demo",
        displayName: "Judge Nova",
        capabilities: ["Testing"],
        idempotencyKey: "join:heartbeat:nova",
      }),
      worldContext(),
      api,
      "judge-demo",
    );
    const joined = await join.json();
    const heartbeatBody = {
      expectedWorldVersion: joined.worldVersion,
      idempotencyKey: "heartbeat:nova:1",
      lastObservedWorldVersion: joined.worldVersion,
      status: "available",
      activeMissionId: null,
    };
    const heartbeat = await postAgentHeartbeat(
      jsonRequest(joined.heartbeatUrl, heartbeatBody),
      agentContext(joined.agent.id),
      api,
    );
    expect(heartbeat.status).toBe(200);
    expect(await heartbeat.json()).toMatchObject({
      accepted: true,
      duplicate: false,
      snapshot: { agents: expect.arrayContaining([expect.objectContaining({ id: joined.agent.id, status: "online" })]) },
    });

    const retry = await postAgentHeartbeat(
      jsonRequest(joined.heartbeatUrl, heartbeatBody),
      agentContext(joined.agent.id),
      api,
    );
    expect(await retry.json()).toMatchObject({ duplicate: true });

    const snapshot = await getWorldSnapshot(
      new Request("https://republic.example/api/worlds/demo/snapshot"),
      worldContext(),
      api,
    );
    expect(snapshot.status).toBe(200);
    expect(snapshot.headers.get("cache-control")).toBe("no-store");

    const missing = await getWorldSnapshot(
      new Request("https://republic.example/api/worlds/other/snapshot"),
      worldContext("other"),
      api,
    );
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "WORLD_NOT_FOUND" } });
  });
});
