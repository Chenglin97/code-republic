import { a2aAgentCardSchema, type A2AAgentCard } from "./contract";

export interface AgentCardValidationIssue {
  path: string;
  message: string;
}

export type AgentCardValidationResult =
  | { valid: true; card: A2AAgentCard; warnings: string[] }
  | { valid: false; issues: AgentCardValidationIssue[] };

function isLocalhost(url: URL) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
}

export function validateAgentCard(input: unknown): AgentCardValidationResult {
  const parsed = a2aAgentCardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const warnings: string[] = [];
  for (const [index, agentInterface] of parsed.data.supportedInterfaces.entries()) {
    const url = new URL(agentInterface.url);
    if (url.protocol !== "https:" && !isLocalhost(url)) {
      warnings.push(`supportedInterfaces.${index}.url should use HTTPS outside local development.`);
    }
  }

  if (!parsed.data.signatures?.length) {
    warnings.push("Agent Card is unsigned; treat declared identity and capabilities as unverified claims.");
  }

  return { valid: true, card: parsed.data, warnings };
}

export function createCodeRepublicAgentCard(origin: string): A2AAgentCard {
  const baseUrl = new URL(origin).origin;
  return {
    name: "Code Republic World Bridge",
    description: "Discovers independently owned agents and prepares an invite-gated handoff into a Code Republic software world.",
    supportedInterfaces: [{
      url: `${baseUrl}/a2a`,
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
    }],
    provider: {
      organization: "Code Republic",
      url: baseUrl,
    },
    version: "0.1.0",
    documentationUrl: "https://github.com/Chenglin97/code-republic/blob/main/docs/A2A_INTEROP.md",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
    },
    defaultInputModes: ["text/plain", "application/vnd.code-republic.join+json"],
    defaultOutputModes: ["text/plain", "application/vnd.code-republic.join-handoff+json"],
    skills: [{
      id: "join-code-republic-world",
      name: "Join a Code Republic World",
      description: "Validates public Agent Card metadata and produces the native invite-gated join request for a Code Republic World.",
      tags: ["agent-discovery", "world-join", "software-collaboration"],
      examples: ["Introduce my agent to the demo world."],
      inputModes: ["text/plain", "application/vnd.code-republic.join+json"],
      outputModes: ["text/plain", "application/vnd.code-republic.join-handoff+json"],
    }],
  };
}
