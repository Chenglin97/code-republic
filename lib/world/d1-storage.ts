import { StorageVersionConflict, validateEventLog, type WorldEventStorage } from "./persistence";
import type { WorldEvent } from "./types";

interface D1Result {
  meta?: { changes?: number };
  success?: boolean;
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface D1DatabaseBinding {
  prepare(query: string): D1Statement;
}

const schemaReady = new WeakMap<object, Promise<void>>();

async function ensureSchema(database: D1DatabaseBinding): Promise<void> {
  const key = database as object;
  let ready = schemaReady.get(key);
  if (!ready) {
    ready = database.prepare(`
      CREATE TABLE IF NOT EXISTS world_event_logs (
        world_id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        events_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `).run().then(() => undefined);
    schemaReady.set(key, ready);
  }
  await ready;
}

function parseEvents(worldId: string, raw: string): WorldEvent[] {
  const events = JSON.parse(raw) as WorldEvent[];
  validateEventLog(worldId, events);
  return events;
}

export class D1WorldEventStorage implements WorldEventStorage {
  constructor(private readonly database: D1DatabaseBinding) {}

  async read(worldId: string): Promise<WorldEvent[] | null> {
    await ensureSchema(this.database);
    const row = await this.database
      .prepare("SELECT events_json FROM world_event_logs WHERE world_id = ?")
      .bind(worldId)
      .first<{ events_json: string }>();
    return row ? parseEvents(worldId, row.events_json) : null;
  }

  async append(worldId: string, expectedVersion: number, events: WorldEvent[]): Promise<void> {
    await ensureSchema(this.database);
    const nextEvents = [...((await this.read(worldId)) ?? []), ...events];
    validateEventLog(worldId, nextEvents);
    const nextVersion = nextEvents.at(-1)?.version ?? 0;
    const serialized = JSON.stringify(nextEvents);
    const updatedAt = Date.now();

    if (expectedVersion === 0) {
      const result = await this.database
        .prepare("INSERT OR IGNORE INTO world_event_logs (world_id, version, events_json, updated_at) VALUES (?, ?, ?, ?)")
        .bind(worldId, nextVersion, serialized, updatedAt)
        .run();
      if ((result.meta?.changes ?? 0) !== 1) {
        throw new StorageVersionConflict(expectedVersion, await this.currentVersion(worldId));
      }
      return;
    }

    const result = await this.database
      .prepare("UPDATE world_event_logs SET version = ?, events_json = ?, updated_at = ? WHERE world_id = ? AND version = ?")
      .bind(nextVersion, serialized, updatedAt, worldId, expectedVersion)
      .run();
    if ((result.meta?.changes ?? 0) !== 1) {
      throw new StorageVersionConflict(expectedVersion, await this.currentVersion(worldId));
    }
  }

  async replace(worldId: string, events: WorldEvent[]): Promise<void> {
    await ensureSchema(this.database);
    validateEventLog(worldId, events);
    await this.database
      .prepare(`
        INSERT INTO world_event_logs (world_id, version, events_json, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(world_id) DO UPDATE SET
          version = excluded.version,
          events_json = excluded.events_json,
          updated_at = excluded.updated_at
      `)
      .bind(worldId, events.at(-1)?.version ?? 0, JSON.stringify(events), Date.now())
      .run();
  }

  private async currentVersion(worldId: string): Promise<number> {
    const row = await this.database
      .prepare("SELECT version FROM world_event_logs WHERE world_id = ?")
      .bind(worldId)
      .first<{ version: number }>();
    return row?.version ?? 0;
  }
}
