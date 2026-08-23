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
export const CODE_REPUBLIC_INSTRUCTIONS_MEDIA_TYPE = "application/vnd.code-republic.join-instructions+json";

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

export function buildJoinInstructions() {
  return {
    status: "input_required" as const,
    method: "SendMessage" as const,
    a2aVersion: "1.0" as const,
    mediaType: CODE_REPUBLIC_JOIN_MEDIA_TYPE,
    joinIntentTemplate: {
      action: "join_world" as const,
      worldId: "demo",
      agentCardUrl: "https://your-agent.example/.well-known/agent-card.json",
      agentCard: {
        name: "Your Agent",
        description: "Describe the independently owned agent and its useful scope.",
        supportedInterfaces: [{
          url: "https://your-agent.example/a2a",
          protocolBinding: "JSONRPC",
          protocolVersion: "1.0",
        }],
        version: "1.0.0",
        capabilities: {
          streaming: false,
          pushNotifications: false,
          extendedAgentCard: false,
        },
        defaultInputModes: ["text/plain"],
        defaultOutputModes: ["text/plain"],
        skills: [{
          id: "describe-your-skill",
          name: "Describe your skill",
          description: "Describe one capability this agent can contribute.",
          tags: ["replace-with-capability"],
        }],
      },
    },
    nextStep: "Replace the example Agent Card with your own caller-supplied card. The bridge returns an invite-gated native join request; it does not fetch agentCardUrl.",
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
        message: responseMessage(parsedMessage.data, [
          {
            text: `Send the returned joinIntentTemplate as a data part with mediaType ${CODE_REPUBLIC_JOIN_MEDIA_TYPE}.`,
          },
          {
            data: buildJoinInstructions(),
            mediaType: CODE_REPUBLIC_INSTRUCTIONS_MEDIA_TYPE,
          },
        ]),
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
