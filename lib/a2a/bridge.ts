import {
  a2aJsonRpcRequestSchema,
  a2aMessageSchema,
  codeRepublicJoinIntentSchema,
  type A2AJsonRpcError,
  type A2AJsonRpcRequest,
  type A2AJsonRpcSuccess,
  type A2AMessage,
} from "./contract";
import {
  codeRepublicIndependentAgentAdapter,
  type IndependentAgentAdapter,
} from "./adapter";

export { buildJoinHandoff } from "./adapter";

export const CODE_REPUBLIC_JOIN_MEDIA_TYPE = "application/vnd.code-republic.join+json";
export const CODE_REPUBLIC_HANDOFF_MEDIA_TYPE = "application/vnd.code-republic.join-handoff+json";

const PUSH_METHODS = new Set([
  "CreateTaskPushNotificationConfig",
  "GetTaskPushNotificationConfig",
  "ListTaskPushNotificationConfigs",
  "DeleteTaskPushNotificationConfig",
]);

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "agent";
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
  reason: string,
  metadata: Record<string, string> = {},
): A2AJsonRpcError {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data: [{
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        reason,
        domain: "code-republic.dev",
        metadata,
      }],
    },
  };
}

export function invalidA2ARequest(id: string | number | null, message = "Request payload validation error") {
  return jsonRpcError(id, -32600, message, "INVALID_REQUEST");
}

export function invalidA2AParams(id: string | number, message: string) {
  return jsonRpcError(id, -32602, message, "INVALID_PARAMS");
}

export function unsupportedA2AVersion(id: string | number | null, version: string) {
  return jsonRpcError(id, -32009, `A2A version ${version} is not supported.`, "VERSION_NOT_SUPPORTED", {
    requestedVersion: version,
    supportedVersion: "1.0",
  });
}

function responseMessage(request: A2AMessage, parts: A2AMessage["parts"]): A2AMessage {
  return {
    messageId: `reply_${slug(request.messageId)}`,
    contextId: request.contextId ?? `ctx_${slug(request.messageId)}`,
    role: "ROLE_AGENT",
    parts,
  };
}

function handleSendMessage(
  request: A2AJsonRpcRequest,
  independentAgentAdapter: IndependentAgentAdapter,
): A2AJsonRpcSuccess | A2AJsonRpcError {
  const parsedMessage = a2aMessageSchema.safeParse(request.params.message);
  if (!parsedMessage.success || parsedMessage.data.role !== "ROLE_USER") {
    return invalidA2AParams(request.id, "SendMessage requires a valid ROLE_USER message with at least one part.");
  }

  const joinPart = parsedMessage.data.parts.find(
    (part) => "data" in part && part.mediaType === CODE_REPUBLIC_JOIN_MEDIA_TYPE,
  );

  if (!joinPart || !("data" in joinPart)) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        message: responseMessage(parsedMessage.data, [{
          text: `Send a data part with mediaType ${CODE_REPUBLIC_JOIN_MEDIA_TYPE} containing action, worldId, agentCardUrl, and agentCard.`,
        }]),
      },
    };
  }

  const parsedIntent = codeRepublicJoinIntentSchema.safeParse(joinPart.data);
  if (!parsedIntent.success) {
    const firstIssue = parsedIntent.error.issues[0];
    return invalidA2AParams(
      request.id,
      `Invalid Code Republic join intent at ${firstIssue?.path.join(".") || "payload"}: ${firstIssue?.message ?? "invalid value"}`,
    );
  }

  const handoff = independentAgentAdapter.prepareJoin(parsedIntent.data);
  return {
    jsonrpc: "2.0",
    id: request.id,
    result: {
      message: responseMessage(parsedMessage.data, [{
        data: handoff,
        mediaType: CODE_REPUBLIC_HANDOFF_MEDIA_TYPE,
      }]),
    },
  };
}

export interface A2ABridgeOptions {
  independentAgentAdapter?: IndependentAgentAdapter;
}

export function handleA2AJsonRpc(
  input: unknown,
  options: A2ABridgeOptions = {},
): A2AJsonRpcSuccess | A2AJsonRpcError {
  const parsedRequest = a2aJsonRpcRequestSchema.safeParse(input);
  if (!parsedRequest.success) return invalidA2ARequest(null);

  const request = parsedRequest.data;
  if (request.method === "SendMessage") {
    return handleSendMessage(
      request,
      options.independentAgentAdapter ?? codeRepublicIndependentAgentAdapter,
    );
  }
  if (request.method === "ListTasks") {
    return { jsonrpc: "2.0", id: request.id, result: { tasks: [] } };
  }
  if (["GetTask", "CancelTask", "SubscribeToTask"].includes(request.method)) {
    const taskId = typeof request.params.id === "string" ? request.params.id : "unknown";
    return jsonRpcError(request.id, -32001, "Task not found", "TASK_NOT_FOUND", { taskId });
  }
  if (request.method === "SendStreamingMessage") {
    return jsonRpcError(request.id, -32004, "Streaming is not supported", "UNSUPPORTED_OPERATION");
  }
  if (PUSH_METHODS.has(request.method)) {
    return jsonRpcError(request.id, -32003, "Push notifications are not supported", "PUSH_NOTIFICATION_NOT_SUPPORTED");
  }
  if (request.method === "GetExtendedAgentCard") {
    return jsonRpcError(request.id, -32004, "Extended Agent Cards are not supported", "UNSUPPORTED_OPERATION");
  }

  return jsonRpcError(request.id, -32601, "Method not found", "METHOD_NOT_FOUND");
}
