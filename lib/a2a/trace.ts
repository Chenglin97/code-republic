import {
  a2aJsonRpcRequestSchema,
  a2aMessageSchema,
  codeRepublicJoinIntentSchema,
  type A2AJsonRpcError,
  type A2AJsonRpcSuccess,
} from "./contract";

export const A2A_RUNTIME_METADATA_KEY = "code-republic.dev/runtime";
export const A2A_USAGE_METADATA_KEY = "code-republic.dev/usage";

export type A2ATraceStatus = "succeeded" | "rejected" | "failed";
export type A2AUsageSource = "adapter-reported" | "caller-reported" | "not-reported";

export interface A2ATokenUsage {
  source: A2AUsageSource;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  totalTokens?: number;
}

export interface A2ATraceRecord {
  traceId: string;
  worldId: string;
  timestamp: string;
  durationMs: number;
  protocolVersion: string;
  transport: "json-rpc";
  method: string;
  rpcId: string | number | null;
  status: A2ATraceStatus;
  requestBytes: number;
  responseBytes: number;
  source: {
    agentName: string;
    ownership: "independently-owned" | "unknown";
    agentType: string;
    provider?: string;
    model?: string;
    cardVersion?: string;
    cardUrl?: string;
    messageId?: string;
    contextId?: string;
  };
  destination: {
    name: "Code Republic World Bridge";
    adapterId: string;
  };
  usage: A2ATokenUsage;
  envelope: {
    request: Record<string, unknown>;
    response: Record<string, unknown>;
  };
}

export interface A2AAdapterTelemetry {
  agentType?: string;
  provider?: string;
  model?: string;
  usage?: Omit<A2ATokenUsage, "source">;
}

interface TraceInput {
  payload: unknown;
  response: A2AJsonRpcSuccess | A2AJsonRpcError;
  protocolVersion: string;
  adapterId: string;
  durationMs: number;
  traceId?: string;
  timestamp?: string;
  adapterTelemetry?: A2AAdapterTelemetry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedLabel(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 120)
    : fallback;
}

function tokenCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}

function reportedUsage(value: unknown): Omit<A2ATokenUsage, "source"> | undefined {
  if (!isRecord(value)) return undefined;
  const usage = {
    inputTokens: tokenCount(value.inputTokens),
    outputTokens: tokenCount(value.outputTokens),
    cachedInputTokens: tokenCount(value.cachedInputTokens),
    totalTokens: tokenCount(value.totalTokens),
  };
  return Object.values(usage).some((count) => count !== undefined) ? usage : undefined;
}

function byteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return 0;
  }
}

function provenanceUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function sanitizedRequestEnvelope(payload: unknown): Record<string, unknown> {
  const parsedRequest = a2aJsonRpcRequestSchema.safeParse(payload);
  if (!parsedRequest.success) return { valid: false, reason: "invalid-json-rpc-request" };

  const request = parsedRequest.data;
  const parsedMessage = a2aMessageSchema.safeParse(request.params.message);
  if (!parsedMessage.success) {
    return {
      jsonrpc: request.jsonrpc,
      id: request.id,
      method: request.method,
      params: { message: "invalid-or-absent" },
    };
  }

  const message = parsedMessage.data;
  return {
    jsonrpc: request.jsonrpc,
    id: request.id,
    method: request.method,
    params: {
      message: {
        messageId: message.messageId,
        contextId: message.contextId,
        taskId: message.taskId,
        role: message.role,
        parts: message.parts.map((part) => ({
          kind: "text" in part ? "text" : "raw" in part ? "raw" : "url" in part ? "url" : "data",
          mediaType: part.mediaType,
        })),
        metadataKeys: [A2A_RUNTIME_METADATA_KEY, A2A_USAGE_METADATA_KEY]
          .filter((key) => key in (message.metadata ?? {})),
      },
    },
  };
}

function sanitizedResponseEnvelope(response: A2AJsonRpcSuccess | A2AJsonRpcError): Record<string, unknown> {
  if ("error" in response) {
    return {
      jsonrpc: response.jsonrpc,
      id: response.id,
      error: {
        code: response.error.code,
        message: response.error.message,
        reason: response.error.data?.[0]?.reason,
      },
    };
  }

  const result = isRecord(response.result) ? response.result : {};
  const parsedMessage = a2aMessageSchema.safeParse(result.message);
  return {
    jsonrpc: response.jsonrpc,
    id: response.id,
    result: parsedMessage.success
      ? {
          message: {
            messageId: parsedMessage.data.messageId,
            contextId: parsedMessage.data.contextId,
            role: parsedMessage.data.role,
            parts: parsedMessage.data.parts.map((part) => ({
              kind: "text" in part ? "text" : "raw" in part ? "raw" : "url" in part ? "url" : "data",
              mediaType: part.mediaType,
            })),
          },
        }
      : { kind: Array.isArray(result.tasks) ? "task-list" : "other" },
  };
}

export function buildA2ATrace(input: TraceInput): A2ATraceRecord {
  const parsedRequest = a2aJsonRpcRequestSchema.safeParse(input.payload);
  const request = parsedRequest.success ? parsedRequest.data : null;
  const parsedMessage = request ? a2aMessageSchema.safeParse(request.params.message) : null;
  const message = parsedMessage?.success ? parsedMessage.data : null;
  const joinPart = message?.parts.find((part) => "data" in part && isRecord(part.data) && part.data.action === "join_world");
  const parsedIntent = joinPart && "data" in joinPart ? codeRepublicJoinIntentSchema.safeParse(joinPart.data) : null;
  const intent = parsedIntent?.success ? parsedIntent.data : null;
  const runtime = isRecord(message?.metadata?.[A2A_RUNTIME_METADATA_KEY])
    ? message?.metadata?.[A2A_RUNTIME_METADATA_KEY] as Record<string, unknown>
    : undefined;
  const callerUsage = reportedUsage(message?.metadata?.[A2A_USAGE_METADATA_KEY]);
  const adapterUsage = input.adapterTelemetry?.usage;
  const usage: A2ATokenUsage = adapterUsage
    ? { source: "adapter-reported", ...adapterUsage }
    : callerUsage
      ? { source: "caller-reported", ...callerUsage }
      : { source: "not-reported" };

  return {
    traceId: input.traceId ?? crypto.randomUUID(),
    worldId: intent?.worldId ?? "demo",
    timestamp: input.timestamp ?? new Date().toISOString(),
    durationMs: Math.max(0, Math.round(input.durationMs * 100) / 100),
    protocolVersion: input.protocolVersion,
    transport: "json-rpc",
    method: request?.method ?? "unknown",
    rpcId: request?.id ?? null,
    status: "error" in input.response ? "rejected" : "succeeded",
    requestBytes: byteLength(input.payload),
    responseBytes: byteLength(input.response),
    source: {
      agentName: intent?.agentCard.name ?? boundedLabel(runtime?.agentName, "Unknown A2A caller"),
      ownership: intent ? "independently-owned" : "unknown",
      agentType: boundedLabel(input.adapterTelemetry?.agentType ?? runtime?.agentType, intent ? "remote-a2a" : "unknown"),
      provider: input.adapterTelemetry?.provider ?? intent?.agentCard.provider?.organization ?? (boundedLabel(runtime?.provider, "") || undefined),
      model: input.adapterTelemetry?.model ?? (boundedLabel(runtime?.model, "") || undefined),
      cardVersion: intent?.agentCard.version,
      cardUrl: provenanceUrl(intent?.agentCardUrl),
      messageId: message?.messageId,
      contextId: message?.contextId,
    },
    destination: {
      name: "Code Republic World Bridge",
      adapterId: input.adapterId,
    },
    usage,
    envelope: {
      request: sanitizedRequestEnvelope(input.payload),
      response: sanitizedResponseEnvelope(input.response),
    },
  };
}
