import { NextResponse } from "next/server";
import { resetWorld } from "@/lib/world/store";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ accepted: true, snapshot: await resetWorld() });
}
