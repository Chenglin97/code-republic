import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { D1DatabaseBinding } from "../world/d1-storage";
import type { A2ATraceRecord } from "./trace";

export interface A2ATraceStorage {
  append(trace: A2ATraceRecord): Promise<void>;
  list(worldId: string, limit: number): Promise<A2ATraceRecord[]>;
}

declare global {
  var __CODE_REPUBLIC_D1__: D1DatabaseBinding | undefined;
}

function assertWorldId(worldId: string): void {
  if (!/^[a-z0-9_-]{1,80}$/i.test(worldId)) {
    throw new Error("World IDs may contain only letters, numbers, dashes, and underscores.");
  }
}

export class LocalJsonA2ATraceStorage implements A2ATraceStorage {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath = path.join(process.cwd(), ".data", "a2a-traces.json")) {}

  append(trace: A2ATraceRecord): Promise<void> {
    assertWorldId(trace.worldId);
    const write = this.writeQueue.then(() => this.persist(trace));
    this.writeQueue = write.catch(() => undefined);
    return write;
  }

  private async persist(trace: A2ATraceRecord): Promise<void> {
    const current = await this.readAll();
    const next = [trace, ...current.filter((item) => item.traceId !== trace.traceId)].slice(0, 500);
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }

  async list(worldId: string, limit: number): Promise<A2ATraceRecord[]> {
    assertWorldId(worldId);
    await this.writeQueue;
    return (await this.readAll()).filter((trace) => trace.worldId === worldId).slice(0, limit);
  }

  private async readAll(): Promise<A2ATraceRecord[]> {
    try {
      const traces = JSON.parse(await readFile(this.filePath, "utf8")) as A2ATraceRecord[];
      return Array.isArray(traces) ? traces : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}

const traceSchemaReady = new WeakMap<object, Promise<void>>();

async function ensureTraceSchema(database: D1DatabaseBinding): Promise<void> {
  const key = database as object;
  let ready = traceSchemaReady.get(key);
  if (!ready) {
    ready = (async () => {
      await database.prepare(`
        CREATE TABLE IF NOT EXISTS a2a_traces (
          trace_id TEXT PRIMARY KEY,
          world_id TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          record_json TEXT NOT NULL
        )
      `).run();
      await database.prepare(`
        CREATE INDEX IF NOT EXISTS idx_a2a_traces_world_timestamp
        ON a2a_traces(world_id, timestamp DESC)
      `).run();
    })();
    traceSchemaReady.set(key, ready);
  }
  await ready;
}

export class D1A2ATraceStorage implements A2ATraceStorage {
  constructor(private readonly database: D1DatabaseBinding) {}

  async append(trace: A2ATraceRecord): Promise<void> {
    assertWorldId(trace.worldId);
    await ensureTraceSchema(this.database);
    await this.database
      .prepare("INSERT OR REPLACE INTO a2a_traces (trace_id, world_id, timestamp, record_json) VALUES (?, ?, ?, ?)")
      .bind(trace.traceId, trace.worldId, trace.timestamp, JSON.stringify(trace))
      .run();
    await this.database
      .prepare("DELETE FROM a2a_traces WHERE world_id = ? AND trace_id NOT IN (SELECT trace_id FROM a2a_traces WHERE world_id = ? ORDER BY timestamp DESC LIMIT 1000)")
      .bind(trace.worldId, trace.worldId)
      .run();
  }

  async list(worldId: string, limit: number): Promise<A2ATraceRecord[]> {
    assertWorldId(worldId);
    await ensureTraceSchema(this.database);
    const result = await this.database
      .prepare("SELECT record_json FROM a2a_traces WHERE world_id = ? ORDER BY timestamp DESC LIMIT ?")
      .bind(worldId, limit)
      .all<{ record_json: string }>();
    return result.results.map((row) => JSON.parse(row.record_json) as A2ATraceRecord);
  }
}

const localStorage = new LocalJsonA2ATraceStorage();
const d1Storage = new WeakMap<object, D1A2ATraceStorage>();

export function a2aTraceStorage(): A2ATraceStorage {
  const database = globalThis.__CODE_REPUBLIC_D1__;
  if (!database) return localStorage;
  const key = database as object;
  let storage = d1Storage.get(key);
  if (!storage) {
    storage = new D1A2ATraceStorage(database);
    d1Storage.set(key, storage);
  }
  return storage;
}
