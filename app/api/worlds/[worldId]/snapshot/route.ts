import { getSnapshot } from "@/lib/world/store";
import { getWorldSnapshot } from "../../handlers";
import type { WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: WorldRouteContext) {
  return getWorldSnapshot(_request, context, { getSnapshot });
}
