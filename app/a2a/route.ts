import {
  handleA2AJsonRpc,
  invalidA2ARequest,
  unsupportedA2AVersion,
} from "../../lib/a2a/bridge";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(invalidA2ARequest(null, "Invalid JSON payload"));
  }

  const id = typeof payload === "object" && payload !== null && "id" in payload
    && (typeof payload.id === "string" || typeof payload.id === "number")
    ? payload.id
    : null;
  const requestedVersion = request.headers.get("a2a-version") || "0.3";
  if (requestedVersion !== "1.0") {
    return Response.json(unsupportedA2AVersion(id, requestedVersion));
  }

  return Response.json(handleA2AJsonRpc(payload));
}
