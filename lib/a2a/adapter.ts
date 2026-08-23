import { validateAgentCard } from "./card";
import type {
  CodeRepublicJoinHandoff,
  CodeRepublicJoinIntent,
} from "./contract";

/**
 * Local transformation boundary for an independently owned agent's
 * caller-supplied Agent Card. Implementations must not retrieve agentCardUrl.
 */
export interface IndependentAgentAdapter {
  readonly id: string;
  prepareJoin(intent: CodeRepublicJoinIntent): CodeRepublicJoinHandoff;
}

function identifierFragment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "agent";
}

function conciseDisplayName(value: string) {
  const displayName = value.trim().replace(/\s+/g, " ").slice(0, 32);
  return displayName.length >= 2 ? displayName : `${displayName} Agent`.slice(0, 32);
}

export function buildJoinHandoff(intent: CodeRepublicJoinIntent): CodeRepublicJoinHandoff {
  const validation = validateAgentCard(intent.agentCard);
  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  }

  const capabilities = Array.from(new Set(validation.card.skills.flatMap((skill) => skill.tags)))
    .map((capability) => capability.trim())
    .filter((capability) => capability.length >= 2 && capability.length <= 40)
    .slice(0, 4);

  return {
    status: "invite_required",
    worldId: intent.worldId,
    sourceAgentCardUrl: intent.agentCardUrl,
    discoveredAgent: {
      name: validation.card.name,
      version: validation.card.version,
      skills: validation.card.skills.map((skill) => skill.id),
    },
    nativeJoin: {
      method: "POST",
      endpoint: `/api/worlds/${encodeURIComponent(intent.worldId)}/join`,
      body: {
        inviteCode: "<one-time-invite>",
        displayName: conciseDisplayName(validation.card.name),
        capabilities: capabilities.length > 0 ? capabilities : ["a2a-agent"],
        idempotencyKey: [
          "a2a",
          intent.worldId,
          identifierFragment(validation.card.name),
          identifierFragment(validation.card.version),
        ].join(":"),
      },
    },
    warnings: [
      ...validation.warnings,
      "Capability declarations are discovery metadata, not reputation evidence.",
      "The bridge does not fetch the supplied Agent Card URL in this slice.",
    ],
  };
}

export const codeRepublicIndependentAgentAdapter: IndependentAgentAdapter = {
  id: "code-republic-invite-handoff-v1",
  prepareJoin: buildJoinHandoff,
};
