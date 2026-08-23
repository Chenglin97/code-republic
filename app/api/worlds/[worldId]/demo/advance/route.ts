import { NextResponse } from "next/server";
import { nextDemoDrafts } from "@/lib/world/actions";
import { appendDrafts, getSnapshot } from "@/lib/world/store";
import { getWorldId, worldErrorResponse, type WorldRouteContext } from "../../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: WorldRouteContext) {
  try {
    const worldId = await getWorldId(context);
    const snapshot = await getSnapshot(worldId);
    const drafts = nextDemoDrafts(snapshot);
    if (drafts.length === 0) {
      return NextResponse.json({ accepted: true, complete: true, snapshot });
    }
    const idempotencyKey = `demo:advance:${snapshot.world.version}`;
    const result = await appendDrafts(worldId, drafts, {
      expectedWorldVersion: snapshot.world.version,
      idempotencyKey,
      idempotencyInput: { worldId, stepVersion: snapshot.world.version },
    });
    return NextResponse.json({ ...result, complete: result.snapshot.world.stage === "completed" });
  } catch (error) {
    return worldErrorResponse(error, "The autonomous demo could not advance.");
  }
}
