import { submitAction } from "@/lib/world/store";
import { postWorldAction } from "../../handlers";
import type { WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: WorldRouteContext) {
  return postWorldAction(request, context, { submitAction });
}
