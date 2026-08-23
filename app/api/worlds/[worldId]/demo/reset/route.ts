import { NextResponse } from "next/server";
import { resetWorld } from "@/lib/world/store";
import { getWorldId, worldErrorResponse, type WorldRouteContext } from "../../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: WorldRouteContext) {
  try {
    return NextResponse.json({ accepted: true, snapshot: await resetWorld(await getWorldId(context)) });
  } catch (error) {
    return worldErrorResponse(error, "The demo World could not be reset.");
  }
}
