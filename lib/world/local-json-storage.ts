import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageVersionConflict, validateEventLog, type WorldEventStorage } from "./persistence";
import type { WorldEvent } from "./types";

export class LocalJsonWorldEventStorage implements WorldEventStorage {
  constructor(private readonly dataDirectory = path.join(process.cwd(), ".data")) {}

  private pathFor(worldId: string): string {
    if (!/^[a-z0-9_-]+$/i.test(worldId)) throw new Error("World IDs may contain only letters, numbers, dashes, and underscores.");
    // Preserve the original hackathon path for the single supported World.
    return worldId === "demo"
      ? path.join(this.dataDirectory, "world-events.json")
      : path.join(this.dataDirectory, `${worldId}-events.json`);
  }

  async read(worldId: string): Promise<WorldEvent[] | null> {
    try {
      const events = JSON.parse(await readFile(this.pathFor(worldId), "utf8")) as WorldEvent[];
      validateEventLog(worldId, events);
      return events;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async append(worldId: string, expectedVersion: number, events: WorldEvent[]): Promise<void> {
    const current = (await this.read(worldId)) ?? [];
    const currentVersion = current.at(-1)?.version ?? 0;
    if (currentVersion !== expectedVersion) {
      throw new StorageVersionConflict(expectedVersion, currentVersion);
    }
    await this.persist(worldId, [...current, ...events]);
  }

  async replace(worldId: string, events: WorldEvent[]): Promise<void> {
    await this.persist(worldId, events);
  }

  private async persist(worldId: string, events: WorldEvent[]): Promise<void> {
    validateEventLog(worldId, events);
    await mkdir(this.dataDirectory, { recursive: true });
    const destination = this.pathFor(worldId);
    const temporaryPath = `${destination}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
    await rename(temporaryPath, destination);
  }
}
