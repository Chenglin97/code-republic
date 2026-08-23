import "server-only";
import { WorldAuthority, type AppendOptions } from "./authority";
import { LocalJsonWorldEventStorage } from "./local-json-storage";
import type { ActionResult, EventDraft, WorldEvent, WorldSnapshot } from "./types";

const authority = new WorldAuthority(new LocalJsonWorldEventStorage());

export function assertSupportedWorld(worldId: string): void {
  authority.assertSupportedWorld(worldId);
}

export function getSnapshot(worldId: string): Promise<WorldSnapshot> {
  return authority.getSnapshot(worldId);
}

export function getEventsAfter(worldId: string, version: number): Promise<WorldEvent[]> {
  return authority.getEventsAfter(worldId, version);
}

export function appendDrafts(worldId: string, drafts: EventDraft[], options?: AppendOptions): Promise<ActionResult> {
  return authority.appendDrafts(worldId, drafts, options);
}

export function submitAction(worldId: string, input: unknown): Promise<ActionResult> {
  return authority.submitAction(worldId, input);
}

export function resetWorld(worldId: string): Promise<WorldSnapshot> {
  return authority.resetWorld(worldId);
}
