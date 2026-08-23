import { NextResponse } from "next/server";
import { nextDemoDrafts } from "@/lib/world/actions";
import { appendDrafts, getSnapshot } from "@/lib/world/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const snapshot = await getSnapshot();
  const drafts = nextDemoDrafts(snapshot);
  if (drafts.length === 0) {
    return NextResponse.json({ accepted: true, complete: true, snapshot });
  }
  const result = await appendDrafts(drafts, `demo:advance:${snapshot.world.version}`);
  return NextResponse.json({ ...result, complete: result.snapshot.world.stage === "completed" });
}
