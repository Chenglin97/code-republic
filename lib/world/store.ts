import "server-only";
import { WorldAuthority, type AppendOptions, type CreateWorldResult } from "./authority";
import { D1WorldEventStorage, type D1DatabaseBinding } from "./d1-storage";
import { LocalJsonWorldEventStorage } from "./local-json-storage";
import type { ActionResult, EventDraft, WorldEvent, WorldSnapshot } from "./types";

declare global {
  var __CODE_REPUBLIC_D1__: D1DatabaseBinding | undefined;
}

const localAuthority = new WorldAuthority(new LocalJsonWorldEventStorage());
const d1Authorities = new WeakMap<object, WorldAuthority>();

function authority(): WorldAuthority {
  const database = globalThis.__CODE_REPUBLIC_D1__;
  if (!database) return localAuthority;
  const key = database as object;
  let instance = d1Authorities.get(key);
  if (!instance) {
    instance = new WorldAuthority(new D1WorldEventStorage(database));
    d1Authorities.set(key, instance);
  }
  return instance;
}

export function assertSupportedWorld(worldId: string): void {
  authority().assertSupportedWorld(worldId);
}

export function getSnapshot(worldId: string): Promise<WorldSnapshot> {
  return authority().getSnapshot(worldId);
}

export function createWorld(worldId: string, events: WorldEvent[]): Promise<CreateWorldResult> {
  return authority().createWorld(worldId, events);
}

export function getEventsAfter(worldId: string, version: number): Promise<WorldEvent[]> {
  return authority().getEventsAfter(worldId, version);
}

export function appendDrafts(worldId: string, drafts: EventDraft[], options?: AppendOptions): Promise<ActionResult> {
  return authority().appendDrafts(worldId, drafts, options);
}

export function submitAction(worldId: string, input: unknown): Promise<ActionResult> {
  return authority().submitAction(worldId, input);
}

export function heartbeatAgent(worldId: string, agentId: string, input: unknown): Promise<ActionResult> {
  return authority().heartbeatAgent(worldId, agentId, input);
}

export function resetWorld(worldId: string): Promise<WorldSnapshot> {
  return authority().resetWorld(worldId);
}
