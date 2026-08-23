import { createHash } from "node:crypto";
import { decideAction, WorldRuleError, worldActionSchema } from "./actions";
import { decideHeartbeat, expiredLeaseDrafts, heartbeatSchema, type HeartbeatInput } from "./heartbeat";
import { StorageVersionConflict, type WorldEventStorage } from "./persistence";
import { projectWorld } from "./reducer";
import { createSeedEvents } from "./seed";
import type { ActionResult, EventDraft, WorldAction, WorldEvent, WorldSnapshot } from "./types";

export const DEMO_WORLD_ID = "demo";

export interface AppendOptions {
  expectedWorldVersion?: number;
  idempotencyKey?: string;
  idempotencyInput?: unknown;
}

export interface CreateWorldResult {
  created: boolean;
  snapshot: WorldSnapshot;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function actionResult(events: WorldEvent[], affected: WorldEvent[], duplicate: boolean): ActionResult {
  return {
    accepted: true,
    duplicate,
    eventIds: affected.map((event) => event.id),
    worldVersion: events.at(-1)?.version ?? 0,
    snapshot: projectWorld(events),
  };
}

export class WorldAuthority {
  private readonly queues = new Map<string, Promise<unknown>>();

  constructor(
    private readonly storage: WorldEventStorage,
    private readonly seed: (worldId: string) => WorldEvent[] = (worldId) => {
      if (worldId !== DEMO_WORLD_ID) return [];
      return createSeedEvents();
    },
    private readonly now: () => Date = () => new Date(),
  ) {}

  assertSupportedWorld(worldId: string): void {
    if (!/^[a-z0-9_-]{1,80}$/i.test(worldId)) {
      throw new WorldRuleError("INVALID_WORLD_ID", "World IDs may contain only letters, numbers, dashes, and underscores.", 400);
    }
  }

  async createWorld(worldId: string, events: WorldEvent[]): Promise<CreateWorldResult> {
    return this.serialize(worldId, async () => {
      this.assertSupportedWorld(worldId);
      const existing = await this.storage.read(worldId);
      if (existing && existing.length > 0) return { created: false, snapshot: projectWorld(existing) };

      try {
        await this.storage.append(worldId, 0, events);
        return { created: true, snapshot: projectWorld(events) };
      } catch (error) {
        if (!(error instanceof StorageVersionConflict)) throw error;
        const raced = await this.storage.read(worldId);
        if (!raced) throw error;
        return { created: false, snapshot: projectWorld(raced) };
      }
    });
  }

  async getSnapshot(worldId: string): Promise<WorldSnapshot> {
    return this.serialize(worldId, async () => projectWorld(await this.readCurrent(worldId)));
  }

  async getEventsAfter(worldId: string, version: number): Promise<WorldEvent[]> {
    return this.serialize(worldId, async () => (await this.readCurrent(worldId)).filter((event) => event.version > version));
  }

  async appendDrafts(worldId: string, drafts: EventDraft[], options: AppendOptions = {}): Promise<ActionResult> {
    return this.serialize(worldId, async () => {
      const events = await this.readCurrent(worldId);
      const requestFingerprint = options.idempotencyKey
        ? fingerprint(options.idempotencyInput ?? drafts)
        : undefined;
      const duplicate = this.findDuplicate(events, options.idempotencyKey, requestFingerprint);
      if (duplicate) return actionResult(events, duplicate, true);

      const currentVersion = events.at(-1)?.version ?? 0;
      if (options.expectedWorldVersion !== undefined && options.expectedWorldVersion !== currentVersion) {
        throw this.versionConflict(options.expectedWorldVersion, currentVersion);
      }
      const materialized = this.materializeDrafts(worldId, events, drafts, options.idempotencyKey, requestFingerprint);
      await this.append(worldId, currentVersion, materialized);
      const nextEvents = [...events, ...materialized];
      return actionResult(nextEvents, materialized, false);
    });
  }

  async submitAction(worldId: string, input: unknown): Promise<ActionResult> {
    const parsed = worldActionSchema.safeParse(input);
    if (!parsed.success) {
      throw new WorldRuleError("INVALID_ACTION", parsed.error.issues[0]?.message ?? "Invalid action.");
    }
    const action = parsed.data as WorldAction;
    const requestFingerprint = fingerprint(action);

    return this.serialize(worldId, async () => {
      const events = await this.readCurrent(worldId);
      const duplicate = this.findDuplicate(events, action.idempotencyKey, requestFingerprint);
      if (duplicate) return actionResult(events, duplicate, true);

      const snapshot = projectWorld(events);
      if (snapshot.world.version !== action.expectedWorldVersion) {
        throw this.versionConflict(action.expectedWorldVersion, snapshot.world.version);
      }
      const materialized = this.materializeDrafts(
        worldId,
        events,
        decideAction(snapshot, action),
        action.idempotencyKey,
        requestFingerprint,
      );
      await this.append(worldId, snapshot.world.version, materialized);
      const nextEvents = [...events, ...materialized];
      return actionResult(nextEvents, materialized, false);
    });
  }

  async heartbeatAgent(worldId: string, agentId: string, input: unknown): Promise<ActionResult> {
    const parsed = heartbeatSchema.safeParse(input);
    if (!parsed.success) {
      throw new WorldRuleError("INVALID_HEARTBEAT", parsed.error.issues[0]?.message ?? "Invalid heartbeat.");
    }
    const heartbeat = parsed.data as HeartbeatInput;
    const requestFingerprint = fingerprint({ agentId, heartbeat });

    return this.serialize(worldId, async () => {
      const events = await this.readCurrent(worldId);
      const duplicate = this.findDuplicate(events, heartbeat.idempotencyKey, requestFingerprint);
      if (duplicate) return actionResult(events, duplicate, true);

      const snapshot = projectWorld(events);
      if (snapshot.world.version !== heartbeat.expectedWorldVersion) {
        throw this.versionConflict(heartbeat.expectedWorldVersion, snapshot.world.version);
      }
      const materialized = this.materializeDrafts(
        worldId,
        events,
        decideHeartbeat(snapshot, agentId, heartbeat),
        heartbeat.idempotencyKey,
        requestFingerprint,
      );
      await this.append(worldId, snapshot.world.version, materialized);
      const nextEvents = [...events, ...materialized];
      return actionResult(nextEvents, materialized, false);
    });
  }

  async resetWorld(worldId: string): Promise<WorldSnapshot> {
    return this.serialize(worldId, async () => {
      this.assertSupportedWorld(worldId);
      const events = this.seed(worldId);
      await this.storage.replace(worldId, events);
      return projectWorld(events);
    });
  }

  private async readOrSeed(worldId: string): Promise<WorldEvent[]> {
    this.assertSupportedWorld(worldId);
    const existing = await this.storage.read(worldId);
    if (existing && existing.length > 0) return existing;
    const events = this.seed(worldId);
    if (events.length === 0) {
      throw new WorldRuleError("WORLD_NOT_FOUND", "The requested World does not exist.", 404);
    }
    try {
      await this.storage.append(worldId, 0, events);
      return events;
    } catch (error) {
      if (!(error instanceof StorageVersionConflict)) throw error;
      const raced = await this.storage.read(worldId);
      if (!raced) throw error;
      return raced;
    }
  }

  private async readCurrent(worldId: string): Promise<WorldEvent[]> {
    const events = await this.readOrSeed(worldId);
    const drafts = expiredLeaseDrafts(projectWorld(events), this.now());
    if (drafts.length === 0) return events;

    const materialized = this.materializeDrafts(worldId, events, drafts);
    await this.append(worldId, events.at(-1)?.version ?? 0, materialized);
    return [...events, ...materialized];
  }

  private findDuplicate(events: WorldEvent[], idempotencyKey?: string, requestFingerprint?: string): WorldEvent[] | null {
    if (!idempotencyKey) return null;
    const existing = events.filter((event) => event.idempotencyKey === idempotencyKey);
    if (existing.length === 0) return null;
    const originalFingerprint = existing[0]?.idempotencyFingerprint;
    if (originalFingerprint && requestFingerprint && originalFingerprint !== requestFingerprint) {
      throw new WorldRuleError(
        "IDEMPOTENCY_KEY_REUSED",
        "This idempotency key was already used for a different request.",
        409,
      );
    }
    return existing;
  }

  private materializeDrafts(
    worldId: string,
    events: WorldEvent[],
    drafts: EventDraft[],
    idempotencyKey?: string,
    idempotencyFingerprint?: string,
  ): WorldEvent[] {
    const baseVersion = events.at(-1)?.version ?? 0;
    const timestamp = this.now().getTime();
    return drafts.map((draft, index) => ({
      ...draft,
      id: `evt_${String(baseVersion + index + 1).padStart(3, "0")}`,
      worldId,
      version: baseVersion + index + 1,
      timestamp: new Date(timestamp + index).toISOString(),
      idempotencyKey: draft.idempotencyKey ?? idempotencyKey,
      idempotencyFingerprint,
    }));
  }

  private async append(worldId: string, expectedVersion: number, events: WorldEvent[]): Promise<void> {
    try {
      await this.storage.append(worldId, expectedVersion, events);
    } catch (error) {
      if (error instanceof StorageVersionConflict) {
        throw this.versionConflict(error.expectedVersion, error.currentVersion);
      }
      throw error;
    }
  }

  private versionConflict(expectedVersion: number, currentVersion: number): WorldRuleError {
    return new WorldRuleError(
      "WORLD_VERSION_CONFLICT",
      "World state changed. Refresh and reconsider this action.",
      409,
      { expectedWorldVersion: expectedVersion, currentWorldVersion: currentVersion },
    );
  }

  private async serialize<T>(worldId: string, operation: () => Promise<T>): Promise<T> {
    const queue = this.queues.get(worldId) ?? Promise.resolve();
    const result = queue.then(operation, operation);
    this.queues.set(worldId, result.then(() => undefined, () => undefined));
    return result;
  }
}
