import { heartbeatAgent } from "@/lib/world/store";
import { postAgentHeartbeat } from "../../../../handlers";
import type { WorldAgentRouteContext } from "../../../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: WorldAgentRouteContext) {
  return postAgentHeartbeat(request, context, { heartbeatAgent });
}
