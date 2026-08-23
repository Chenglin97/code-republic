import { NextResponse } from "next/server";
import { submitAction } from "@/lib/world/store";
import { getWorldId, readJson, worldErrorResponse, type WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: WorldRouteContext) {
  try {
    return NextResponse.json(await submitAction(await getWorldId(context), await readJson(request)));
  } catch (error) {
    return worldErrorResponse(error, "The World could not record this action.");
  }
}
