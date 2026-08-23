import type { WorldEvent } from "./types";

/**
 * Canonical storage boundary for a World event log. A database adapter should
 * implement append as one compare-version-and-insert transaction.
 */
export interface WorldEventStorage {
  read(worldId: string): Promise<WorldEvent[] | null>;
  append(worldId: string, expectedVersion: number, events: WorldEvent[]): Promise<void>;
  replace(worldId: string, events: WorldEvent[]): Promise<void>;
}

export class StorageVersionConflict extends Error {
  constructor(
    public readonly expectedVersion: number,
    public readonly currentVersion: number,
  ) {
    super(`Expected World version ${expectedVersion}, but storage is at ${currentVersion}.`);
    this.name = "StorageVersionConflict";
  }
}

export function validateEventLog(worldId: string, events: WorldEvent[]): void {
  const ids = new Set<string>();
  events.forEach((event, index) => {
    const expectedVersion = index + 1;
    if (event.worldId !== worldId) {
      throw new Error(`Event ${event.id} belongs to ${event.worldId}, not ${worldId}.`);
    }
    if (event.version !== expectedVersion) {
      throw new Error(`Event ${event.id} has version ${event.version}; expected ${expectedVersion}.`);
    }
    if (ids.has(event.id)) throw new Error(`Duplicate World event ID: ${event.id}.`);
    ids.add(event.id);
  });
}
