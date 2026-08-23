import { appendDrafts } from "@/lib/world/store";
import { postWorldJoin } from "../../handlers";
import type { WorldRouteContext } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: WorldRouteContext) {
  return postWorldJoin(request, context, { appendDrafts });
}
