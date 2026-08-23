import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { decideAction, WorldRuleError, worldActionSchema } from "./actions";
import { projectWorld } from "./reducer";
import { createSeedEvents } from "./seed";
import type { ActionResult, EventDraft, WorldAction, WorldEvent, WorldSnapshot } from "./types";

const dataDirectory = path.join(process.cwd(), ".data");
const eventsPath = path.join(dataDirectory, "world-events.json");
let mutationQueue: Promise<unknown> = Promise.resolve();

async function readEvents(): Promise<WorldEvent[]> {
  try {
    return JSON.parse(await readFile(eventsPath, "utf8")) as WorldEvent[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const events = createSeedEvents();
    await persistEvents(events);
    return events;
  }
}

async function persistEvents(events: WorldEvent[]): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryPath = `${eventsPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");
  await rename(temporaryPath, eventsPath);
}

function materializeDrafts(events: WorldEvent[], drafts: EventDraft[], idempotencyKey?: string): WorldEvent[] {
  const baseVersion = events.at(-1)?.version ?? 0;
  const timestamp = Date.now();
  return drafts.map((draft, index) => ({
    ...draft,
    id: `evt_${String(baseVersion + index + 1).padStart(3, "0")}`,
    worldId: "demo",
    version: baseVersion + index + 1,
    timestamp: new Date(timestamp + index).toISOString(),
    idempotencyKey: draft.idempotencyKey ?? idempotencyKey,
  }));
}

async function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function getSnapshot(): Promise<WorldSnapshot> {
  return projectWorld(await readEvents());
}

export async function getEventsAfter(version: number): Promise<WorldEvent[]> {
  return (await readEvents()).filter((event) => event.version > version);
}

export async function appendDrafts(drafts: EventDraft[], idempotencyKey?: string): Promise<ActionResult> {
  return serialize(async () => {
    const events = await readEvents();
    if (idempotencyKey) {
      const existing = events.filter((event) => event.idempotencyKey === idempotencyKey);
      if (existing.length > 0) {
        return {
          accepted: true,
          duplicate: true,
          eventIds: existing.map((event) => event.id),
          worldVersion: events.at(-1)?.version ?? 0,
          snapshot: projectWorld(events),
        };
      }
    }
    const materialized = materializeDrafts(events, drafts, idempotencyKey);
    const nextEvents = [...events, ...materialized];
    await persistEvents(nextEvents);
    return {
      accepted: true,
      duplicate: false,
      eventIds: materialized.map((event) => event.id),
      worldVersion: nextEvents.at(-1)?.version ?? 0,
      snapshot: projectWorld(nextEvents),
    };
  });
}

export async function submitAction(input: unknown): Promise<ActionResult> {
  const parsed = worldActionSchema.safeParse(input);
  if (!parsed.success) throw new WorldRuleError("INVALID_ACTION", parsed.error.issues[0]?.message ?? "Invalid action.");
  const action = parsed.data as WorldAction;
  return serialize(async () => {
    const events = await readEvents();
    const existing = events.filter((event) => event.idempotencyKey === action.idempotencyKey);
    if (existing.length > 0) {
      return {
        accepted: true,
        duplicate: true,
        eventIds: existing.map((event) => event.id),
        worldVersion: events.at(-1)?.version ?? 0,
        snapshot: projectWorld(events),
      };
    }
    const snapshot = projectWorld(events);
    if (snapshot.world.version !== action.expectedWorldVersion) {
      throw new WorldRuleError("WORLD_VERSION_CONFLICT", "World state changed. Refresh and reconsider this action.", 409);
    }
    const materialized = materializeDrafts(events, decideAction(snapshot, action), action.idempotencyKey);
    const nextEvents = [...events, ...materialized];
    await persistEvents(nextEvents);
    return {
      accepted: true,
      duplicate: false,
      eventIds: materialized.map((event) => event.id),
      worldVersion: nextEvents.at(-1)?.version ?? 0,
      snapshot: projectWorld(nextEvents),
    };
  });
}

export async function resetWorld(): Promise<WorldSnapshot> {
  return serialize(async () => {
    const events = createSeedEvents();
    await persistEvents(events);
    return projectWorld(events);
  });
}
