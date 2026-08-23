import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);
const absoluteUrl = z.string().url();

export const a2aAgentInterfaceSchema = z.object({
  url: absoluteUrl,
  protocolBinding: nonEmptyText,
  protocolVersion: z.string().regex(/^\d+\.\d+$/, "Use an A2A major.minor protocol version."),
  tenant: nonEmptyText.optional(),
}).passthrough();

export const a2aAgentSkillSchema = z.object({
  id: nonEmptyText,
  name: nonEmptyText,
  description: nonEmptyText,
  tags: z.array(nonEmptyText).min(1),
  examples: z.array(nonEmptyText).optional(),
  inputModes: z.array(nonEmptyText).min(1).optional(),
  outputModes: z.array(nonEmptyText).min(1).optional(),
  securityRequirements: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

export const a2aAgentCapabilitiesSchema = z.object({
  streaming: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  extendedAgentCard: z.boolean().optional(),
  extensions: z.array(z.object({
    uri: absoluteUrl,
    description: z.string().optional(),
    required: z.boolean().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  }).passthrough()).optional(),
}).passthrough();

/**
 * The public A2A v1.0 Agent Card fields Code Republic consumes and emits.
 * Unknown fields are retained for forward compatibility with newer A2A minors.
 */
export const a2aAgentCardSchema = z.object({
  name: nonEmptyText,
  description: nonEmptyText,
  supportedInterfaces: z.array(a2aAgentInterfaceSchema).min(1),
  provider: z.object({
    organization: nonEmptyText,
    url: absoluteUrl,
  }).passthrough().optional(),
  version: nonEmptyText,
  documentationUrl: absoluteUrl.optional(),
  iconUrl: absoluteUrl.optional(),
  capabilities: a2aAgentCapabilitiesSchema,
  securitySchemes: z.record(z.string(), z.unknown()).optional(),
  securityRequirements: z.array(z.record(z.string(), z.unknown())).optional(),
  defaultInputModes: z.array(nonEmptyText).min(1),
  defaultOutputModes: z.array(nonEmptyText).min(1),
  skills: z.array(a2aAgentSkillSchema).min(1),
  signatures: z.array(z.object({
    protected: nonEmptyText,
    signature: nonEmptyText,
    header: z.record(z.string(), z.unknown()).optional(),
  }).passthrough()).optional(),
}).passthrough();

export type A2AAgentCard = z.infer<typeof a2aAgentCardSchema>;

export const codeRepublicJoinIntentSchema = z.object({
  action: z.literal("join_world"),
  worldId: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  agentCardUrl: absoluteUrl,
  agentCard: a2aAgentCardSchema,
});

export type CodeRepublicJoinIntent = z.infer<typeof codeRepublicJoinIntentSchema>;

export const codeRepublicJoinHandoffSchema = z.object({
  status: z.literal("invite_required"),
  worldId: z.string(),
  sourceAgentCardUrl: absoluteUrl,
  discoveredAgent: z.object({
    name: z.string(),
    version: z.string(),
    skills: z.array(z.string()),
  }),
  nativeJoin: z.object({
    method: z.literal("POST"),
    endpoint: z.string(),
    body: z.object({
      inviteCode: z.literal("<one-time-invite>"),
      displayName: z.string(),
      capabilities: z.array(z.string()).min(1).max(4),
      idempotencyKey: z.string(),
    }),
  }),
  warnings: z.array(z.string()),
});

export type CodeRepublicJoinHandoff = z.infer<typeof codeRepublicJoinHandoffSchema>;

export const a2aPartSchema = z.union([
  z.object({ text: z.string() }).passthrough(),
  z.object({
    data: z.record(z.string(), z.unknown()),
    mediaType: z.string().optional(),
  }).passthrough(),
]);

export const a2aMessageSchema = z.object({
  messageId: nonEmptyText,
  contextId: nonEmptyText.optional(),
  taskId: nonEmptyText.optional(),
  role: z.enum(["ROLE_USER", "ROLE_AGENT"]),
  parts: z.array(a2aPartSchema).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  extensions: z.array(nonEmptyText).optional(),
  referenceTaskIds: z.array(nonEmptyText).optional(),
}).passthrough();

export type A2AMessage = z.infer<typeof a2aMessageSchema>;

export const a2aJsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  method: nonEmptyText,
  params: z.record(z.string(), z.unknown()).optional().default({}),
});

export type A2AJsonRpcRequest = z.infer<typeof a2aJsonRpcRequestSchema>;

export interface A2AJsonRpcSuccess<TResult = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result: TResult;
}

export interface A2AJsonRpcError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: Array<Record<string, unknown>>;
  };
}
