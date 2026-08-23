import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/world/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSnapshot(), {
    headers: { "Cache-Control": "no-store" },
  });
}
