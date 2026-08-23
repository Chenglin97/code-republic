import {
  handleA2AJsonRpc,
  invalidA2ARequest,
  unsupportedA2AVersion,
} from "../../lib/a2a/bridge";
import { codeRepublicIndependentAgentAdapter } from "../../lib/a2a/adapter";
import { buildA2ATrace, type A2ATraceRecord } from "../../lib/a2a/trace";
import { a2aTraceStorage } from "../../lib/a2a/trace-storage";

export const dynamic = "force-dynamic";

interface A2ARouteDependencies {
  recordTrace(trace: A2ATraceRecord): Promise<void>;
}

const defaultDependencies: A2ARouteDependencies = {
  recordTrace: (trace) => a2aTraceStorage().append(trace),
};

async function responseWithTrace(
  payload: unknown,
  responsePayload: ReturnType<typeof handleA2AJsonRpc>,
  protocolVersion: string,
  startedAt: number,
  dependencies: A2ARouteDependencies,
) {
  const trace = buildA2ATrace({
    payload,
    response: responsePayload,
    protocolVersion,
    adapterId: codeRepublicIndependentAgentAdapter.id,
    durationMs: performance.now() - startedAt,
  });
  let traceStatus = "recorded";
  try {
    await dependencies.recordTrace(trace);
  } catch (error) {
    traceStatus = "unavailable";
    console.error("A2A trace persistence failed", error);
  }
  return Response.json(responsePayload, {
    headers: {
      "Cache-Control": "no-store",
      "X-Code-Republic-Trace-Id": trace.traceId,
      "X-Code-Republic-Trace-Status": traceStatus,
    },
  });
}

export async function postA2A(request: Request, dependencies: A2ARouteDependencies = defaultDependencies) {
  const startedAt = performance.now();
  const requestedVersion = request.headers.get("a2a-version") || "0.3";
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return responseWithTrace(
      undefined,
      invalidA2ARequest(null, "Invalid JSON payload"),
      requestedVersion,
      startedAt,
      dependencies,
    );
  }

  const id = typeof payload === "object" && payload !== null && "id" in payload
    && (typeof payload.id === "string" || typeof payload.id === "number")
    ? payload.id
    : null;
  if (requestedVersion !== "1.0") {
    return responseWithTrace(
      payload,
      unsupportedA2AVersion(id, requestedVersion),
      requestedVersion,
      startedAt,
      dependencies,
    );
  }

  return responseWithTrace(
    payload,
    handleA2AJsonRpc(payload),
    requestedVersion,
    startedAt,
    dependencies,
  );
}

export function POST(request: Request) {
  return postA2A(request);
}
