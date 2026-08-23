import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/world/store";
import { getWorldId, worldErrorResponse, type WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: WorldRouteContext) {
  try {
    return NextResponse.json(await getSnapshot(await getWorldId(context)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return worldErrorResponse(error, "The World snapshot could not be loaded.");
  }
}
